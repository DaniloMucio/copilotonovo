
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, Radio as RadioIcon, Volume2, VolumeX } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { useRadio, type RadioStation } from '@/context/RadioContext';

const radioStations: RadioStation[] = [
    { 
        id: 'kissfm',
        name: 'Kiss FM', 
        description: "O melhor do Rock 'n' Roll", 
        streamUrl: 'https://playerservices.streamtheworld.com/api/livestream-redirect/RADIO_KISSFM_ADP.aac',
    },
    {
        id: 'bandfm',
        name: 'Band FM (São Paulo)',
        description: 'A sua rádio, do seu jeito!',
        streamUrl: 'https://playerservices.streamtheworld.com/api/livestream-redirect/BANDFM_SPAAC.aac',
    },
    {
        id: 'bandnewsfm',
        name: 'BandNews FM (São Paulo)',
        description: 'Em 20 minutos, tudo pode mudar.',
        streamUrl: 'https://playerservices.streamtheworld.com/api/livestream-redirect/BANDNEWSFM_SPAAC.aac',
    },
    {
        id: 'cbn',
        name: 'CBN (São Paulo)',
        description: 'A rádio que toca notícia.',
        streamUrl: 'https://playerservices.streamtheworld.com/api/livestream-redirect/CBN_SPAAC.aac',
    }
];

export default function RadioPage() {
    const { 
        isPlaying, 
        currentStation, 
        volume,
        selectStation,
        togglePlayPause,
        setVolume,
    } = useRadio();
    
    return (
        <div className="space-y-6">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {radioStations.map((station) => (
                    <Card key={station.id} className="flex flex-col justify-between">
                         <CardHeader>
                            <div>
                                <CardTitle className="text-lg">{station.name}</CardTitle>
                                <CardDescription className="text-xs">{station.description}</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={() => selectStation(station)} className="w-full">
                                <Play className="mr-2 h-4 w-4"/> Ouvir
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
