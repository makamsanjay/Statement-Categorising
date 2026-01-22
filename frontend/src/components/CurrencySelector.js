export default function CurrencySelector({ value, onChange }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}>
      <option value="USD">USD</option>
      <option value="INR">INR</option>
      <option value="EUR">EUR</option>
      <option value="GBP">GBP</option>
    </select>
  );
}
