'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, ExternalLink, MapPin } from 'lucide-react';
import { RadioStation } from '@/lib/radio-stations';

interface RadioStationCardProps {
  station: RadioStation;
  isCurrentStation: boolean;
  isPlaying: boolean;
  onSelect: (station: RadioStation) => void;
  onTogglePlayPause: () => void;
}

export function RadioStationCard({ 
  station, 
  isCurrentStation, 
  isPlaying, 
  onSelect, 
  onTogglePlayPause 
}: RadioStationCardProps) {
  
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'music': return '🎵';
      case 'news': return '📰';
      case 'specialized': return '🎶';
      case 'regional': return '🌟';
      default: return '📻';
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'music': return 'Musical';
      case 'news': return 'Notícias';
      case 'specialized': return 'Especializada';
      case 'regional': return 'Regional';
      default: return 'Geral';
    }
  };

  const handleCardClick = () => {
    if (isCurrentStation) {
      onTogglePlayPause();
    } else {
      onSelect(station);
    }
  };

  const handleWebsiteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (station.website) {
      window.open(station.website, '_blank');
    }
  };

  return (
    <Card 
      className={`flex flex-col justify-between hover:shadow-lg transition-all duration-200 cursor-pointer ${
        isCurrentStation ? 'ring-2 ring-primary shadow-lg' : ''
      }`}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-foreground">
              {station.name}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground mt-1">
              {station.description}
            </CardDescription>
          </div>
          
          {/* Botão do site */}
          {station.website && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleWebsiteClick}
              className="h-8 w-8 p-0 hover:bg-primary/10"
              title="Visitar site da rádio"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Categoria e região */}
        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full font-medium">
            {getCategoryIcon(station.category)} {getCategoryName(station.category)}
          </span>
          
          {station.region && (
            <span className="text-xs px-2 py-1 bg-muted text-muted-foreground rounded-full flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {station.region}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <Button 
          onClick={(e) => {
            e.stopPropagation();
            if (isCurrentStation) {
              onTogglePlayPause();
            } else {
              onSelect(station);
            }
          }}
          className="w-full"
          variant={isCurrentStation ? "default" : "outline"}
          size="lg"
        >
          {isCurrentStation ? (
            isPlaying ? (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Pausar
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Continuar
              </>
            )
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Ouvir
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
