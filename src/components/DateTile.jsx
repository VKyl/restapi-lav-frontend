import { dateParts } from '../utils/format.js';

export default function DateTile({ date, past = false, large = false }) {
  const { day, month, weekday } = dateParts(date);
  return (
    <div className={`date-tile ${past ? 'is-past' : ''} ${large ? 'date-tile-lg' : ''}`}>
      <span className="dt-month">{month}</span>
      <span className="dt-day">{day}</span>
      <span className="dt-weekday">{weekday}</span>
    </div>
  );
}
