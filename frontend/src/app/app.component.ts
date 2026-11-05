import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { NavbarComponent } from './navbar/navbar.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, SidebarComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  title = 'Expense Splitter';
  isDarkMode = false;
  showLayout = true;

  constructor(
    private themeService: ThemeService,
    private router: Router
  ) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.showLayout = !this.isAuthUrl(event.urlAfterRedirects || event.url);
    });
  }

  ngOnInit(): void {
    this.isDarkMode = this.themeService.isDarkMode();
    this.showLayout = !this.isAuthUrl(this.router.url);
  }

  private isAuthUrl(url: string): boolean {
    return url.startsWith('/auth');
  }
}