// Renders a rules object (label→sentence) as a tidy bulleted list.
export default function RulesList({ rules }) {
  return (
    <ul className="rules-list">
      {Object.values(rules).map((v, i) => (
        <li key={i}>{v}</li>
      ))}
    </ul>
  )
}
