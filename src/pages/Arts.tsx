import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { artsAPI } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import Pagination from '@/components/Pagination';
import ArtCreateModal from '@/components/ArtCreateModal';
import { Plus } from 'lucide-react';

const Arts = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const pageParam = Number(searchParams.get('page') || '1');
  const limit = 20;
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['arts', { page: pageParam, limit }],
    queryFn: () => artsAPI.getAll({ page: pageParam, limit }),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const payload = (data as any)?.data?.data;
  const arts = payload?.arts || [];
  const count = payload?.count || 0;
  const totalPages = Math.max(1, Math.ceil(count / limit));

  const handlePageChange = (nextPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', String(nextPage));
    setSearchParams(newParams);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="container mx-auto px-4 py-12 flex-1">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground via-muted-foreground to-foreground/70 bg-clip-text text-transparent">
            Discover Art
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Explore a curated collection of stunning artworks from talented artists around the world
          </p>
        </div>

        {!isLoading && user?.role === 'artist' && (
          <div className="mb-8 flex justify-end">
            <Button onClick={() => setIsModalOpen(true)} size="lg" className="gap-2 shadow-lg">
              <Plus className="h-5 w-5" />
              Create New Art
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i}>
                <Skeleton className="h-64 w-full" />
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {(Array.isArray(arts) ? arts : []).map((art: any) => (
              <Card
                key={art._id}
                className="group cursor-pointer"
                onClick={() => navigate(`/arts/${art._id}`)}
              >
                <div className="aspect-square overflow-hidden bg-gradient-to-br from-muted to-muted/50">
                  {art.images?.[0]?.url && (
                    <img
                      src={art.images[0].url}
                      alt={art.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-1 group-hover:text-primary transition-colors line-clamp-1">
                    {art.name}
                  </h3>
                  {art.category && (
                    <p className="text-sm text-muted-foreground line-clamp-1 mb-2">
                      {art.category}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/artist/${art.artist?._id}`);
                      }}
                      className="text-xs text-muted-foreground hover:text-primary transition-colors"
                    >
                      by {art.artist?.username || 'Unknown'}
                    </button>
                    {art.price && (
                      <span className="text-sm font-semibold text-primary">
                        ${art.price}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && arts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No artworks found</p>
          </div>
        )}

        {!isLoading && totalPages > 1 && (
          <div className="mt-10 flex justify-center">
            <Pagination
              currentPage={pageParam}
              totalPages={totalPages}
              isLoading={isFetching}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </main>

      <ArtCreateModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSuccess={() => {
          // Refetch arts after creating
          window.location.reload();
        }}
      />

      <Footer />
    </div>
  );
};

export default Arts;
