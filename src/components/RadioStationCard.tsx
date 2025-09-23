'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, MapPin } from 'lucide-react';
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


  return (
    <Card 
      className={`shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500 cursor-pointer ${
        isCurrentStation ? 'ring-2 ring-blue-500 shadow-xl' : ''
      }`}
      onClick={handleCardClick}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <CardHeader className="pb-3 relative z-10">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900">
              {station.name}
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 mt-1">
              {station.description}
            </CardDescription>
          </div>
          
        </div>

        {/* Categoria e região */}
        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs px-2 py-1 bg-gradient-to-r from-blue-600/10 to-purple-600/10 text-blue-600 rounded-full font-medium shadow-sm">
            {getCategoryIcon(station.category)} {getCategoryName(station.category)}
          </span>
          
          {station.region && (
            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full flex items-center gap-1 shadow-sm">
              <MapPin className="h-3 w-3" />
              {station.region}
            </span>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0 relative z-10">
        <Button 
          onClick={(e) => {
            e.stopPropagation();
            if (isCurrentStation) {
              onTogglePlayPause();
            } else {
              onSelect(station);
            }
          }}
          className={`w-full rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-medium ${
            isCurrentStation 
              ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700' 
              : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'
          }`}
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
