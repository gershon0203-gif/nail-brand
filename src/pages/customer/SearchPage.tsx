import { useSearchParams } from 'react-router-dom';
import { CatalogPage } from './CatalogPage';

export default function SearchPage() {
  const [params] = useSearchParams();
  const query = params.get('q') || '';
  return <CatalogPage key={query} mode="search" search={query} />;
}
