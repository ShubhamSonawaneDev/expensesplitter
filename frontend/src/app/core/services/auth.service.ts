import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface User {
  id?: string | number;
  name: string;
  email: string;
  username?: string;
  phone?: string;
  phoneNumber?: string;
  token?: string;
  role?: string;
  upiId?: string;
  profilePicture?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser$: Observable<User | null>;

  constructor(private http: HttpClient) {
    this.currentUserSubject = new BehaviorSubject<User | null>(
      JSON.parse(sessionStorage.getItem('currentUser') || 'null'),
    );
    this.currentUser$ = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    return this.currentUserValue?.token || null;
  }

  login(email: string, password: string, rememberMe: boolean = false): Observable<User> {
    return this.http.post<any>(`${environment.apiUrl}/auth/login`, { email, password, rememberMe }).pipe(
      map((response) => {
        if (response && response.token) {
          sessionStorage.setItem('currentUser', JSON.stringify(response));
          this.currentUserSubject.next(response);
        }
        return response;
      }),
    );
  }

  logout(): void {
    sessionStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  refreshToken(): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/auth/refresh`, {}).pipe(
      map((response) => {
        if (response.token) {
          sessionStorage.setItem('currentUser', JSON.stringify(response));
          this.currentUserSubject.next(response);
        }
        return response;
      }),
    );
  }

  register(user: { username: string; email: string; password: string; name: string; phone: string }): Observable<User> {
    return this.http.post<any>(`${environment.apiUrl}/auth/register`, user).pipe(
      map((response) => {
        return response;
      }),
    );
  }

    googleLogin(idToken: string): Observable<User> {
    return this.http.post<any>(`${environment.apiUrl}/auth/google`, { idToken }).pipe(
      map((response) => {
        if (response && response.token) {
          sessionStorage.setItem('currentUser', JSON.stringify(response));
          this.currentUserSubject.next(response);
        }
        return response;
      }),
    );
  }

  isAuthenticated(): boolean {
    return !!this.currentUserValue;
  }

  updateProfile(id: number | string, userData: { name: string; username: string; phone: string }): Observable<User> {
    return this.http.put<any>(`${environment.apiUrl}/users/${id}`, userData).pipe(
      map((response) => {
        const currentUser = this.currentUserValue;
        if (currentUser) {
          const updatedUser = { ...currentUser, ...response };
          sessionStorage.setItem('currentUser', JSON.stringify(updatedUser));
          this.currentUserSubject.next(updatedUser);
        }
        return response;
      }),
    );
  }

    forgotPassword(email: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/auth/forgot-password`, { email });
  }

   resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/auth/reset-password`, { token, password: newPassword });
  }
}
