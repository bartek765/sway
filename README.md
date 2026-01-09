# Sway

An opinionated multi-step form component for Angular. Built with Signals and View Transitions API.

## Usage

To start using the library, install it in your project:

```bash
npm install @sway/forms
```

Add `SwayFormComponent` and `SwayStepDirective` to your component imports. Then, wrap your steps with `<sway-form>`.

```typescript
import { SwayFormComponent, SwayStepDirective } from '@sway/forms';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [SwayFormComponent, SwayStepDirective, FormsModule],
  template: `
    <sway-form (formSubmit)="onSubmit()">
      
      <div *swayStep="'step1'; title: 'Info'">
        <form #f="ngForm">
          <input name="email" [(ngModel)]="email" required email />
        </form>
      </div>

      <div *swayStep="'step2'; title: 'Review'">
        <p>Reviewing: {{ email }}</p>
      </div>

    </sway-form>
  `
})
export class App {}
```

## Features

- **Signals-powered**: Reactive state management with zero RxJS boilerplate.

- **View Transitions**: Built-in, buttery-smooth morphing between steps.

- **Auto-validation**: Automatically detects Angular forms and blocks navigation if invalid.

- **Direction-aware**: Natural sliding animations based on navigation flow.

- **Shake feedback**: Premium visual cues when a user attempts to proceed with errors.

