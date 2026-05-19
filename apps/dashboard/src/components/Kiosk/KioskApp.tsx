import { CalendarPanel } from '../Calendar/CalendarPanel.js';
import { Clock } from '../Clock/Clock.js';
import { TodaySoonRail } from '../Clock/TodaySoonRail.js';
import { DashboardLayout } from '../Layout/DashboardLayout.js';
import { TodosPanel } from '../Todos/TodosPanel.js';
import { TransportPanel } from '../Transport/TransportPanel.js';
import { WeatherPanel } from '../Weather/WeatherPanel.js';

export function KioskApp() {
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
