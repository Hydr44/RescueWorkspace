import PageHeader from './PageHeader.jsx';

// Pagina non ancora rifatta: tiene la rotta viva e mostra il titolo nel tema nuovo.
export default function Placeholder({ title }) {
  return (
    <div className="rm-page">
      <PageHeader title={title} sub="Pagina da rifare nel tema nuovo" />
    </div>
  );
}
