
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Radio as RadioIcon, Volume2, VolumeX, Play, Pause, Sparkles } from 'lucide-react';
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
            {/* Header */}
            <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 group">
                    <RadioIcon className="h-6 w-6 text-white group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Rádio Player</h1>
                    <p className="text-gray-600">Escute suas rádios favoritas</p>
                </div>
            </div>

            {/* Player Principal */}
            <div className="sticky top-16 md:top-0 z-10">
                <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <CardHeader className="relative z-10">
                        <CardTitle className="flex items-center gap-2 text-gray-900">
                           <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
                               <RadioIcon className="h-4 w-4 text-white" />
                           </div>
                           Rádio Player
                        </CardTitle>
                        <CardDescription>
                            {currentStation ? `Ouvindo: ${currentStation.name}` : 'Selecione uma rádio para começar'}
                        </CardDescription>
                    </CardHeader>
                    {currentStation && (
                        <CardContent className="flex items-center gap-4 relative z-10">
                            <Button 
                                onClick={togglePlayPause} 
                                size="icon" 
                                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                            </Button>
                            <div className="flex items-center gap-2 flex-1">
                                {volume > 0 ? <Volume2 className="h-5 w-5 text-gray-600" /> : <VolumeX className="h-5 w-5 text-gray-600" />}
                                <Slider 
                                    value={[volume]}
                                    max={1}
                                    step={0.05}
                                    onValueChange={(value) => setVolume(value[0])}
                                    className="flex-1"
                                />
                            </div>
                        </CardContent>
                    )}
                </Card>
            </div>

            {/* Filtros e Busca */}
            <div className="space-y-4">
                <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <CardContent className="pt-6 relative z-10">
                        <div className="flex flex-col sm:flex-row gap-4">
                            {/* Busca */}
                            <div className="flex-1">
                                <input
                                    type="text"
                                    placeholder="Buscar rádios..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border-gray-300 text-gray-900 hover:bg-gray-50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                                        className={`flex items-center gap-2 ${
                                            selectedCategory === category.id 
                                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-medium' 
                                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl shadow-md hover:shadow-lg transition-all duration-300'
                                        }`}
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
                <Card className="shadow-lg bg-white/80 backdrop-blur-sm border-0 rounded-2xl overflow-hidden group hover:shadow-xl transition-all duration-500">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <CardContent className="pt-6 text-center relative z-10">
                        <p className="text-gray-600">
                            Nenhuma rádio encontrada com os filtros selecionados.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
