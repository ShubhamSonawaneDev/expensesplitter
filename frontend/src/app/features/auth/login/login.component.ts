import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, NgZone } from '@angular/core';
import { GoogleAuthService } from '../../../core/services/google-auth.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatCheckboxModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit, AfterViewInit {
    @ViewChild('googleBtn', { static: true }) googleBtn!: ElementRef<HTMLElement>;
  loginForm: FormGroup;
  loading = false;
  submitted = false;
  errorMessage = '';
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private notificationService: NotificationService,
        private googleAuth: GoogleAuthService,
    private ngZone: NgZone,
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false],
    });
  }

  ngOnInit(): void {
    if (this.authService.currentUserValue) {
      this.router.navigate(['/dashboard']);
    }
  }
  ngAfterViewInit(): void {
     if (!this.googleBtn) { return; }
    this.googleAuth
      .renderButton(this.googleBtn.nativeElement, (idToken) => {
        this.ngZone.run(() => {
          this.loading = true;
          this.errorMessage = '';
          this.authService.googleLogin(idToken).subscribe({
            next: () => {
              this.loading = false;
              this.notificationService.showSuccess('Login successful!');
              this.router.navigate(['/dashboard']);
            },
            error: (err) => {
              this.loading = false;
              this.errorMessage = err?.error?.message || 'Google login failed. Please try again.';
            },
          });
        });
      })
      .catch(() => (this.errorMessage = 'Could not load Google sign-in.'));
  }
  get f() {
    return this.loginForm.controls;
  }

  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';

    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.authService.login(this.f['email'].value, this.f['password'].value, this.f['rememberMe'].value).subscribe({
      next: (response) => {
        this.loading = false;
        this.notificationService.showSuccess('Login successful!');
        const returnUrl = this.route.snapshot.queryParams['returnUrl'];
        this.router.navigate([returnUrl || '/dashboard']);
      },
      error: (error) => {
        this.loading = false;
        console.error('Login error:', error);
        this.errorMessage = error?.error?.message || error?.message || 'Login failed. Please try again.';
      },
    });
  }
}
