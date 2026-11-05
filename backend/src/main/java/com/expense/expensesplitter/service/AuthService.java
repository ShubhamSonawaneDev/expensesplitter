package com.expense.expensesplitter.service;

import com.expense.expensesplitter.config.JwtUtil;
import com.expense.expensesplitter.dto.AuthRequest;
import com.expense.expensesplitter.dto.AuthResponse;
import com.expense.expensesplitter.exception.ResourceNotFoundException;
import com.expense.expensesplitter.model.User;
import com.expense.expensesplitter.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Value;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private EmailService emailService;

        @Value("${app.google.client-id:}")
    private String googleClientId;

  public AuthResponse login(AuthRequest request) {

    User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new ResourceNotFoundException("User", "email not found: " + request.getEmail()));

    if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
        throw new BadCredentialsException("Invalid email or password");
    }

    String token = jwtUtil.generateToken(user.getUsername(), user.getId());

    // Handle Remember Me token
    if (request.isRememberMe()) {
        String rememberToken = java.util.UUID.randomUUID().toString();
        user.setRememberToken(rememberToken);
        userRepository.save(user);
        // The JWT token itself serves as the session - rememberMe is tracked for future auto-login
    }

    return AuthResponse.builder()
            .id(user.getId())
            .email(user.getEmail())
            .name(user.getName())
            .username(user.getUsername())
            .token(token)
            .tokenType("Bearer")
            .message("Login successful")
            .build();
}

    public AuthResponse register(User user) {
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new IllegalArgumentException("Username already exists");
        }
        if (userRepository.existsByEmail(user.getEmail())) {
            throw new IllegalArgumentException("Email already exists");
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        User savedUser = userRepository.save(user);

        String token = jwtUtil.generateToken(savedUser.getUsername(), savedUser.getId());

        // Send welcome email asynchronously
        try {
            emailService.sendWelcomeEmail(savedUser);
        } catch (Exception e) {
            // Log error but don't fail registration
            System.err.println("Failed to send welcome email: " + e.getMessage());
        }

        return AuthResponse.builder()
                .id(savedUser.getId())
                .email(savedUser.getEmail())
                .name(savedUser.getName())
                .username(savedUser.getUsername())
                .token(token)
                .tokenType("Bearer")
                .message("Registration successful")
                .build();
    }

           public void forgotPassword(String email) {
        // Same response whether or not the email exists (no user enumeration)
        java.util.Optional<User> optionalUser = userRepository.findByEmail(email);
        if (optionalUser.isEmpty()) {
            return;
        }
        User user = optionalUser.get();

        String token = java.util.UUID.randomUUID().toString();
        user.setResetToken(token);
        user.setResetTokenExpiry(java.time.LocalDateTime.now().plusMinutes(15));
        userRepository.save(user);

                System.out.println("DEV ONLY - PASSWORD RESET LINK for " + email
                + " : http://localhost:4200/auth/reset-password?token=" + token);

        emailService.sendPasswordResetEmail(user, token);
    }

    public void resetPassword(String token, String newPassword) {
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("Invalid reset token");
        }
        if (newPassword == null || !newPassword.matches("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,100}$")) {
            throw new IllegalArgumentException(
                "Password must be at least 8 characters with uppercase, lowercase and digit");
        }

        User user = userRepository.findByResetToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Reset link is invalid or expired"));

        if (user.getResetTokenExpiry() == null
                || user.getResetTokenExpiry().isBefore(java.time.LocalDateTime.now())) {
            throw new IllegalArgumentException("Reset link is invalid or expired");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);
    }

    public void saveRememberToken(String token, User user) {
        user.setRememberToken(token);
        userRepository.save(user);
    }

    public User findByRememberToken(String token) {
        return userRepository.findByRememberToken(token).orElse(null);
    }


        public AuthResponse loginWithGoogle(String idTokenString) {
        if (googleClientId == null || googleClientId.isBlank()) {
            throw new IllegalArgumentException("Google login is not configured on the server");
        }
        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(), GsonFactory.getDefaultInstance())
                    .setAudience(java.util.Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken == null) {
                throw new BadCredentialsException("Invalid Google token");
            }
            GoogleIdToken.Payload payload = idToken.getPayload();
            if (!Boolean.TRUE.equals(payload.getEmailVerified())) {
                throw new BadCredentialsException("Google email not verified");
            }

            String email = payload.getEmail();
            String name = (String) payload.get("name");
            if (name == null || name.isBlank()) {
                name = email.split("@")[0];
            }

            User user = userRepository.findByEmail(email).orElse(null);
            if (user == null) {
                String base = email.split("@")[0].replaceAll("[^A-Za-z0-9]", "");
                if (base.length() < 3) base = base + "user";
                if (base.length() > 40) base = base.substring(0, 40);
                String username = base;
                while (userRepository.existsByUsername(username)) {
                    username = base + (int) (Math.random() * 10000);
                }
                user = userRepository.save(User.builder()
                        .username(username)
                        .email(email)
                        .name(name)
                        .password(passwordEncoder.encode(java.util.UUID.randomUUID().toString()))
                        .build());
            }

            String token = jwtUtil.generateToken(user.getUsername(), user.getId());
            return AuthResponse.builder()
                    .id(user.getId())
                    .email(user.getEmail())
                    .name(user.getName())
                    .username(user.getUsername())
                    .token(token)
                    .tokenType("Bearer")
                    .message("Login successful")
                    .build();
        } catch (java.security.GeneralSecurityException | java.io.IOException e) {
            throw new BadCredentialsException("Google verification failed");
        }
    }
}