import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Palette, Image, BookOpen, Users, ArrowRight } from 'lucide-react';
import heroImage from '@/assets/hero-art.jpg';
import galleryBg from '@/assets/gallery-bg.jpg';

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 to-foreground/60" />
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-background/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-background/30">
            <Palette className="h-4 w-4 text-background" />
            <span className="text-sm text-background font-medium">Where Art Meets Community</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-background">
            Discover & Collect
            <br />
            <span className="bg-gradient-to-r from-background to-muted-foreground bg-clip-text text-transparent">
              Extraordinary Art
            </span>
          </h1>
          
          <p className="text-xl text-background/90 mb-8 max-w-2xl mx-auto">
            Connect with talented artists, explore unique artworks, and build your personal collection
          </p>
          
          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              size="lg"
              onClick={() => navigate('/arts')}
              className="gap-2 shadow-[var(--shadow-elegant)]"
            >
              Explore Gallery
              <ArrowRight className="h-4 w-4" />
            </Button>
            {!user && (
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/signup')}
                className="bg-background/10 backdrop-blur-sm border-background/30 text-background hover:bg-background/20"
              >
                Join as Artist
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need for Art
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A complete platform for artists to showcase and sell, and art lovers to discover and collect
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-[var(--shadow-elegant)] hover:shadow-[var(--shadow-hover)] transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="inline-flex p-4 bg-primary/10 rounded-full mb-4">
                  <Image className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Browse Arts</h3>
                <p className="text-muted-foreground mb-4">
                  Explore a diverse collection of artworks from emerging and established artists
                </p>
                <Button variant="ghost" onClick={() => navigate('/arts')} className="gap-2">
                  View Gallery
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-[var(--shadow-elegant)] hover:shadow-[var(--shadow-hover)] transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="inline-flex p-4 bg-secondary/10 rounded-full mb-4">
                  <BookOpen className="h-8 w-8 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Read Blogs</h3>
                <p className="text-muted-foreground mb-4">
                  Get inspired by stories, insights, and creative journeys from artists
                </p>
                <Button variant="ghost" onClick={() => navigate('/blogs')} className="gap-2">
                  Read More
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-[var(--shadow-elegant)] hover:shadow-[var(--shadow-hover)] transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="inline-flex p-4 bg-accent/10 rounded-full mb-4">
                  <Users className="h-8 w-8 text-accent-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Join Community</h3>
                <p className="text-muted-foreground mb-4">
                  Connect with artists, follow your favorites, and engage with art you love
                </p>
                <Button
                  variant="ghost"
                  onClick={() => navigate(user ? '/arts' : '/signup')}
                  className="gap-2"
                >
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="relative py-20 px-4"
        style={{
          backgroundImage: `url(${galleryBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/75 to-foreground/60" />
        <div className="relative z-10 container mx-auto text-center text-background">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Your Art Journey?
          </h2>
          <p className="text-xl mb-8 text-background/90 max-w-2xl mx-auto">
            Whether you're an artist looking to showcase your work or an art lover ready to discover,
            ArtScape is your platform
          </p>
          <Button
            size="lg"
            onClick={() => navigate(user ? '/arts' : '/signup')}
            className="bg-background text-foreground hover:bg-background/90 shadow-[var(--shadow-elegant)]"
          >
            {user ? 'Explore Now' : 'Sign Up Free'}
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
