
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Radio as RadioIcon, Volume2, VolumeX, Play, Pause } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { useRadio } from '@/context/RadioContext';
import { radioStations, getStationsByCategory, searchStations } from '@/lib/radio-stations';
import { RadioStationCard } from '@/components/RadioStationCard';

export default function RadioPage() {
    const { 
        isPlaying, 
        currentStation, 
        volume,
        selectStation,
        togglePlayPause,
        setVolume,
    } = useRadio();
    
    // Estados para filtros e busca
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    
    // Categorias das rádios
    const categories = [
        { id: 'all', name: 'Todas', icon: '📻' },
        { id: 'music', name: 'Musicais', icon: '🎵' },
        { id: 'news', name: 'Notícias', icon: '📰' },
        { id: 'specialized', name: 'Especializadas', icon: '🎶' },
        { id: 'regional', name: 'Regionais', icon: '🌟' }
    ];
    
    // Filtra rádios baseado na busca e categoria
    const filteredStations = searchTerm 
        ? searchStations(searchTerm).filter(station => 
            selectedCategory === 'all' || station.category === selectedCategory
          )
        : getStationsByCategory(selectedCategory);
    
    return (
        <div className="space-y-6">
            {/* Player Principal */}
            <div className="sticky top-16 md:top-0 z-10">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                           <RadioIcon className="h-6 w-6" /> Rádio Player
                        </CardTitle>
                        <CardDescription>
                            {currentStation ? `Ouvindo: ${currentStation.name}` : 'Selecione uma rádio para começar'}
                        </CardDescription>
                    </CardHeader>
                    {currentStation && (
                        <CardContent className="flex items-center gap-4">
                            <Button onClick={togglePlayPause} size="icon" variant="outline">
                                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                            </Button>
                            <div className="flex items-center gap-2 flex-1">
                                {volume > 0 ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                                <Slider 
                                    value={[volume]}
                                    max={1}
                                    step={0.05}
                                    onValueChange={(value) => setVolume(value[0])}
                                />
                            </div>
                        </CardContent>
                    )}
                </Card>
            </div>

            {/* Filtros e Busca */}
            <div className="space-y-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                            {/* Busca */}
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Buscar rádios..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                            </div>
                            
                            {/* Categorias */}
                            <div className="flex gap-2 flex-wrap">
                                {categories.map((category) => (
                                    <Button
                                        key={category.id}
                                        variant={selectedCategory === category.id ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setSelectedCategory(category.id)}
                                        className="flex items-center gap-2"
                                    >
                                        <span>{category.icon}</span>
                                        {category.name}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Lista de Rádios */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredStations.map((station) => (
                    <RadioStationCard
                        key={station.id}
                        station={station}
                        isCurrentStation={currentStation?.id === station.id}
                        isPlaying={isPlaying}
                        onSelect={selectStation}
                        onTogglePlayPause={togglePlayPause}
                    />
                ))}
            </div>
            
            {/* Mensagem quando não há resultados */}
            {filteredStations.length === 0 && (
                <Card>
                    <CardContent className="pt-6 text-center">
                        <p className="text-muted-foreground">
                            Nenhuma rádio encontrada com os filtros selecionados.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
