import {Component, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {SwayFormComponent, SwayNavigationEvent, SwayStepDirective} from '../lib';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    SwayFormComponent,
    SwayStepDirective,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Sway - Multi-Step Form Library');

  personalInfo = signal({
    firstName: '',
    lastName: '',
    email: '',
  });

  addressInfo = signal({
    street: '',
    city: '',
    zipCode: '',
  });

  preferences = signal({
    newsletter: false,
    notifications: true,
  });

  /**
   * Reaguje na każdą zmianę kroku wewnątrz SwayFormComponent
   */
  onStepChange(event: SwayNavigationEvent): void {
    console.log('Krok zmieniony:', event);
  }

  /**
   * Wywoływane po kliknięciu "Submit" na ostatnim kroku
   */
  onFormSubmit(): void {
    console.log('Formularz wysłany!', {
      personal: this.personalInfo(),
      address: this.addressInfo(),
      preferences: this.preferences(),
    });
    alert('Sukces! Dane zostały zapisane (sprawdź konsolę).');
  }
}
