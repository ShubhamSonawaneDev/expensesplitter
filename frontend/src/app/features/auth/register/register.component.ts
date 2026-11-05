import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, NgZone } from '@angular/core';
import { GoogleAuthService } from '../../../core/services/google-auth.service';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
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
  selector: 'app-register',
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
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent implements OnInit, AfterViewInit {
  @ViewChild('googleBtn', { static: true }) googleBtn!: ElementRef<HTMLElement>;
  registerForm: FormGroup;
  loading = false;
  submitted = false;
  errorMessage = '';
  hidePassword = true;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private notificationService: NotificationService,
        private googleAuth: GoogleAuthService,
    private ngZone: NgZone,
  ) {
    this.registerForm = this.fb.group(
      {
        name: ['', [Validators.required, Validators.minLength(3)]],
        email: ['', [Validators.required, Validators.email]],
        phone: ['', [Validators.required, Validators.pattern('^[0-9]{10,15}$')]],
       password: ['', [Validators.required, Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/)]],
        confirmPassword: ['', Validators.required],
        terms: [false, Validators.requiredTrue],
        privacy: [true],
      },
      { validators: this.passwordMatchValidator },
    );
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
              this.notificationService.showSuccess('Signed in with Google!');
              this.router.navigate(['/dashboard']);
            },
            error: (err) => {
              this.loading = false;
              this.errorMessage = err?.error?.message || 'Google sign-up failed. Please try again.';
            },
          });
        });
      })
      .catch(() => (this.errorMessage = 'Could not load Google sign-in.'));
  }

  get f() {
    return this.registerForm.controls;
  }

  passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  togglePasswordVisibility() {
    this.hidePassword = !this.hidePassword;
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';

    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;
    const { name, email, password, phone } = this.registerForm.value;

    const payload = {
      username: email.split('@')[0] + Math.floor(Math.random() * 1000),
      email,
      password,
      name,
      phone,
    };

    this.authService.register(payload).subscribe({
      next: () => {
        this.loading = false;
        this.notificationService.showSuccess('Welcome! Registration successful.');
        this.router.navigate(['/auth/login']);
      },
      error: (err: any) => {
        this.loading = false;
        this.errorMessage = err?.error?.message || 'Something went wrong. Try again.';
      },
    });
  }
}