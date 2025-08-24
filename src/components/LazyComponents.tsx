import { lazy } from 'react';

// Lazy loading para componentes pesados do dashboard
export const LazyExpenseManager = lazy(() => 
  import('./ExpenseManager').then(module => ({ default: module.ExpenseManager }))
);

export const LazyIncomeManager = lazy(() => 
  import('./IncomeManager').then(module => ({ default: module.IncomeManager }))
);

export const LazyDeliveryHistory = lazy(() => 
  import('./DeliveryHistory').then(module => ({ default: module.DeliveryHistory }))
);

export const LazyReportsManager = lazy(() => 
  import('./ReportsManager').then(module => ({ default: module.ReportsManager }))
);

export const LazyJornadaManager = lazy(() => 
  import('./JornadaManager').then(module => ({ default: module.JornadaManager }))
);

export const LazyAppointmentList = lazy(() => 
  import('./AppointmentList').then(module => ({ default: module.AppointmentList }))
);

export const LazyNotesManager = lazy(() => 
  import('./NotesManager').then(module => ({ default: module.NotesManager }))
);

// Lazy loading para formulários pesados
export const LazyDeliveryForm = lazy(() => 
  import('./forms/DeliveryForm').then(module => ({ default: module.DeliveryForm }))
);

export const LazyExpenseForm = lazy(() => 
  import('./forms/ExpenseForm').then(module => ({ default: module.ExpenseForm }))
);

export const LazyIncomeForm = lazy(() => 
  import('./forms/IncomeForm').then(module => ({ default: module.IncomeForm }))
);

export const LazyAppointmentForm = lazy(() => 
  import('./forms/AppointmentForm').then(module => ({ default: module.AppointmentForm }))
);

export const LazyShiftEditForm = lazy(() => 
  import('./forms/ShiftEditForm').then(module => ({ default: module.ShiftEditForm }))
);

export const LazyProfileForm = lazy(() => 
  import('./forms/ProfileForm').then(module => ({ default: module.ProfileForm }))
);

export const LazyChangePasswordForm = lazy(() => 
  import('./forms/ChangePasswordForm').then(module => ({ default: module.ChangePasswordForm }))
);
