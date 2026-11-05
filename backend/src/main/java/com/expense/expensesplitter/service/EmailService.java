package com.expense.expensesplitter.service;

import com.expense.expensesplitter.model.User;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.Map;

@Service
public class EmailService {

        private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private TemplateEngine templateEngine;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Value("${app.frontend.url:http://localhost:4200}")
    private String frontendUrl;

    @Async
    public void sendEmail(String to, String subject, String templateName, Map<String, Object> variables) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            Context context = new Context();
            if (variables != null) {
                variables.forEach(context::setVariable);
            }
            context.setVariable("frontendUrl", frontendUrl);

            String htmlContent = templateEngine.process(templateName, context);

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send email", e);
        }
    }

    @Async
    public void sendExpenseNotification(User user, String expenseDescription, Double amount, String paidBy) {
        if (Boolean.FALSE.equals(user.getEmailNotificationsEnabled()) || Boolean.FALSE.equals(user.getReceiveExpenseEmails())) {
            return;
        }

        Map<String, Object> variables = new HashMap<>();
        variables.put("userName", user.getName());
        variables.put("expenseDescription", expenseDescription);
        variables.put("amount", amount);
        variables.put("paidBy", paidBy);
        variables.put("actionUrl", frontendUrl + "/expenses");

        sendEmail(
            user.getEmail(),
            "New Expense Added: " + expenseDescription,
            "expense-notification",
            variables
        );
    }

    @Async
    public void sendSettlementNotification(User user, String fromUser, Double amount, boolean isPaymentReceived) {
        if (Boolean.FALSE.equals(user.getEmailNotificationsEnabled()) || Boolean.FALSE.equals(user.getReceiveSettlementEmails())) {
            return;
        }

        Map<String, Object> variables = new HashMap<>();
        variables.put("userName", user.getName());
        variables.put("fromUser", fromUser);
        variables.put("amount", amount);
        variables.put("isPaymentReceived", isPaymentReceived);
        variables.put("actionUrl", frontendUrl + "/settlements");

        String subject = isPaymentReceived 
            ? "Payment Received: $" + amount + " from " + fromUser
            : "Settlement Due: You owe $" + amount + " to " + fromUser;

        sendEmail(
            user.getEmail(),
            subject,
            "settlement-notification",
            variables
        );
    }

    @Async
    public void sendGroupInviteNotification(User user, String groupName, String invitedBy) {
        if (Boolean.FALSE.equals(user.getEmailNotificationsEnabled()) || Boolean.FALSE.equals(user.getReceiveGroupEmails())) {
            return;
        }

        Map<String, Object> variables = new HashMap<>();
        variables.put("userName", user.getName());
        variables.put("groupName", groupName);
        variables.put("invitedBy", invitedBy);
        variables.put("actionUrl", frontendUrl + "/groups");

        sendEmail(
            user.getEmail(),
            "Group Invitation: " + groupName,
            "group-invite-notification",
            variables
        );
    }

    @Async
    public void sendWeeklySummary(User user, Map<String, Object> summaryData) {
        if (Boolean.FALSE.equals(user.getEmailNotificationsEnabled()) || Boolean.FALSE.equals(user.getReceiveWeeklySummary())) {
            return;
        }

        Map<String, Object> variables = new HashMap<>(summaryData);
        variables.put("userName", user.getName());
        variables.put("actionUrl", frontendUrl + "/dashboard");

        sendEmail(
            user.getEmail(),
            "Your Weekly Expense Summary",
            "weekly-summary",
            variables
        );
    }

    @Async
    public void sendWelcomeEmail(User user) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("userName", user.getName());
        variables.put("actionUrl", frontendUrl + "/dashboard");

        sendEmail(
            user.getEmail(),
            "Welcome to Expense Splitter!",
            "welcome-email",
            variables
        );
    }

        @Async
    public void sendPasswordResetEmail(User user, String resetToken) {
        String resetUrl = frontendUrl + "/auth/reset-password?token=" + resetToken;

        // Dev fallback: SMTP not configured, so print the link instead of sending email
        if (fromEmail == null || fromEmail.isBlank()) {
            log.warn("SMTP not configured. PASSWORD RESET LINK for {} : {}", user.getEmail(), resetUrl);
            return;
        }

        Map<String, Object> variables = new HashMap<>();
        variables.put("userName", user.getName());
        variables.put("resetUrl", resetUrl);

        try {
            sendEmail(user.getEmail(), "Password Reset Request", "password-reset", variables);
        } catch (Exception e) {
            log.error("Failed to send reset email to {}: {}", user.getEmail(), e.getMessage());
        }
    }
}