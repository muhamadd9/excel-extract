import { Button } from '@/components/ui/button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
}

const Pagination = ({ currentPage, totalPages, isLoading, onPageChange }: PaginationProps) => {
  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  const goTo = (page: number) => {
    if (page < 1 || page > totalPages) return;
    onPageChange(page);
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" disabled={!canPrev || isLoading} onClick={() => goTo(1)}>
        « First
      </Button>
      <Button variant="outline" disabled={!canPrev || isLoading} onClick={() => goTo(currentPage - 1)}>
        ‹ Prev
      </Button>
      <span className="px-3 text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </span>
      <Button variant="outline" disabled={!canNext || isLoading} onClick={() => goTo(currentPage + 1)}>
        Next ›
      </Button>
      <Button variant="outline" disabled={!canNext || isLoading} onClick={() => goTo(totalPages)}>
        Last »
      </Button>
    </div>
  );
};

export default Pagination;


