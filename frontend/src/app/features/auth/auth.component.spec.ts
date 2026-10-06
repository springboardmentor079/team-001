import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthComponent } from './auth.component';
import { AuthService } from '../../core/auth.service';
describe('Authentication forms', () => {
  function setup(mode: string) {
    const auth = {
      restore: () => of(false),
      login: vi.fn(() =>
        throwError(() => ({ error: { message: 'Email or password is incorrect.' } })),
      ),
      register: vi.fn(),
    };
    TestBed.configureTestingModule({
      imports: [AuthComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: AuthService, useValue: auth },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { data: { mode }, queryParamMap: { get: () => null } } },
        },
      ],
    });
    return { component: TestBed.createComponent(AuthComponent).componentInstance, auth };
  }
  it('does not submit an empty login', () => {
    const { component, auth } = setup('login');
    component.submit();
    expect(auth.login).not.toHaveBeenCalled();
    expect(component.error()).toContain('check');
  });
  it('shows backend credential errors and clears loading', () => {
    const { component } = setup('login');
    component.form.patchValue({ email: 'user@example.com', password: 'WrongPassword2026!' });
    component.submit();
    expect(component.error()).toBe('Email or password is incorrect.');
    expect(component.busy()).toBe(false);
  });
  it('rejects mismatched registration passwords before the API call', () => {
    const { component, auth } = setup('register');
    component.form.patchValue({
      name: 'Priya Nair',
      company: 'Construction',
      email: 'priya@example.com',
      password: 'StrongPassword2026!',
      confirm: 'DifferentPassword2026!',
    });
    component.submit();
    expect(auth.register).not.toHaveBeenCalled();
    expect(component.error()).toContain('do not match');
  });
});
