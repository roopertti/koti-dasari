import { CalendarPanel } from './components/Calendar/CalendarPanel.js';
import { Clock } from './components/Clock/Clock.js';
import { TodaySoonRail } from './components/Clock/TodaySoonRail.js';
import { DashboardLayout } from './components/Layout/DashboardLayout.js';
import { TodosPanel } from './components/Todos/TodosPanel.js';
import { TransportPanel } from './components/Transport/TransportPanel.js';
import { WeatherPanel } from './components/Weather/WeatherPanel.js';

export function App() {
  return (
    <DashboardLayout
      header={
        <>
          <Clock />
          <TodaySoonRail />
        </>
      }
      weather={<WeatherPanel />}
      transport={<TransportPanel />}
      calendar={<CalendarPanel />}
      todos={<TodosPanel />}
    />
  );
}
