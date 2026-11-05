package com.expense.expensesplitter.controller;

import com.expense.expensesplitter.dto.AuthRequest;
import com.expense.expensesplitter.dto.AuthResponse;
import com.expense.expensesplitter.model.User;
import com.expense.expensesplitter.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

  @PostMapping("/login")
  public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
    AuthResponse response = authService.login(request);
    return new ResponseEntity<>(response, HttpStatus.OK);
  }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody User user) {
        AuthResponse response = authService.register(user);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> request) {
        authService.forgotPassword(request.get("email"));
        return ResponseEntity.ok().body(Map.of("message", "Password reset link sent to your email"));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        authService.resetPassword(request.get("token"), request.get("password"));
        return ResponseEntity.ok().body(Map.of("message", "Password has been reset successfully"));
    }

        @PostMapping("/google")
    public ResponseEntity<AuthResponse> googleLogin(@RequestBody Map<String, String> request) {
        return ResponseEntity.ok(authService.loginWithGoogle(request.get("idToken")));
    }

    @PostMapping("/login-with-token")
    public ResponseEntity<?> loginWithRememberToken(@RequestBody Map<String, String> request) {
        String token = request.get("token");
        User user = authService.findByRememberToken(token);
        if (user == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid remember token"));
        }

        return ResponseEntity.ok().body(Map.of(
                "token", token,
                "email", user.getEmail(),
                "name", user.getName(),
                "username", user.getUsername(),
                "message", "Login successful with remember token"
        ));
    }
}