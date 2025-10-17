'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, Loader2, Printer, Download, FileText } from 'lucide-react' // Import ikon yang diperlukan

import { cn } from '@/lib/utils'
import { openPrintReport } from '@/lib/printReport'
import { exportAsCSV, exportAsJSON } from '@/lib/exportReport'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card' // Import CardFooter
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export type Sekolah = {
  id: number
  nama_sekolah: string
}

export function CalculatorForm() {
  const [openMula, setOpenMula] = React.useState(false)
  const [openDestinasi, setOpenDestinasi] = React.useState(false)
  const [openWaypoints, setOpenWaypoints] = React.useState<boolean[]>([])
  
  const [sekolahMula, setSekolahMula] = React.useState<string>('')
  const [sekolahDestinasi, setSekolahDestinasi] = React.useState<string>('')
  const [waypoints, setWaypoints] = React.useState<string[]>([])
  const [kadar, setKadar] = React.useState<string>('0.70')

  // === SEARCH STATES ===
  const [searchMula, setSearchMula] = React.useState<string>('')
  const [searchDestinasi, setSearchDestinasi] = React.useState<string>('')
  const [searchWaypoints, setSearchWaypoints] = React.useState<string[]>([])
  const [searchResultsMula, setSearchResultsMula] = React.useState<Sekolah[]>([])
  const [searchResultsDestinasi, setSearchResultsDestinasi] = React.useState<Sekolah[]>([])
  const [searchResultsWaypoints, setSearchResultsWaypoints] = React.useState<Sekolah[][]>([])
  const [isSearchingMula, setIsSearchingMula] = React.useState(false)
  const [isSearchingDestinasi, setIsSearchingDestinasi] = React.useState(false)
  const [isSearchingWaypoints, setIsSearchingWaypoints] = React.useState<boolean[]>([])

  // === BAHAGIAN BARU: State untuk menyimpan hasil, status loading, dan ralat ===
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [distance, setDistance] = React.useState<number | null>(null)
  const [cost, setCost] = React.useState<number | null>(null)
  const [routeDetails, setRouteDetails] = React.useState<any>(null)
  const [optimizeRoute, setOptimizeRoute] = React.useState<boolean>(true) // Default enabled
  // ========================================================================

  // === SEARCH FUNCTIONS ===
  const searchSekolah = async (query: string, setResults: (results: Sekolah[]) => void, setIsSearching: (loading: boolean) => void) => {
    if (query.length < 2) {
      setResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/search-sekolah?q=${encodeURIComponent(query)}&limit=20`)
      const data = await response.json()
      
      if (response.ok) {
        setResults(data.schools || [])
      } else {
        console.error('Search error:', data.error)
        setResults([])
      }
    } catch (error) {
      console.error('Search request failed:', error)
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // Debounced search untuk Sekolah Mula
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchSekolah(searchMula, setSearchResultsMula, setIsSearchingMula)
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [searchMula])

  // Debounced search untuk Sekolah Destinasi  
  React.useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchSekolah(searchDestinasi, setSearchResultsDestinasi, setIsSearchingDestinasi)
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [searchDestinasi])

  // === WAYPOINT MANAGEMENT FUNCTIONS ===
  const addWaypoint = () => {
    if (waypoints.length < 8) { // Google Maps limit is 23, but we keep it reasonable
      setWaypoints([...waypoints, ''])
      setSearchWaypoints([...searchWaypoints, ''])
      setOpenWaypoints([...openWaypoints, false])
      setSearchResultsWaypoints([...searchResultsWaypoints, []])
      setIsSearchingWaypoints([...isSearchingWaypoints, false])
    }
  }

  const removeWaypoint = (index: number) => {
    const newWaypoints = waypoints.filter((_, i) => i !== index)
    const newSearchWaypoints = searchWaypoints.filter((_, i) => i !== index)
    const newOpenWaypoints = openWaypoints.filter((_, i) => i !== index)
    const newSearchResults = searchResultsWaypoints.filter((_, i) => i !== index)
    const newIsSearching = isSearchingWaypoints.filter((_, i) => i !== index)
    
    setWaypoints(newWaypoints)
    setSearchWaypoints(newSearchWaypoints)
    setOpenWaypoints(newOpenWaypoints)
    setSearchResultsWaypoints(newSearchResults)
    setIsSearchingWaypoints(newIsSearching)
  }

  // Debounced search untuk waypoints
  React.useEffect(() => {
    searchWaypoints.forEach((search, index) => {
      const timeoutId = setTimeout(() => {
        if (search) {
          searchSekolah(search, (results) => {
            const newResults = [...searchResultsWaypoints]
            newResults[index] = results
            setSearchResultsWaypoints(newResults)
          }, (loading) => {
            const newLoading = [...isSearchingWaypoints]
            newLoading[index] = loading
            setIsSearchingWaypoints(newLoading)
          })
        }
      }, 300)
      return () => clearTimeout(timeoutId)
    })
  }, [searchWaypoints])

  // === BAHAGIAN BARU: Fungsi untuk memanggil API pengiraan ===
  const handleKira = async () => {
    // 1. Validasi input
    if (!sekolahMula || !sekolahDestinasi) {
      setError('Sila pilih sekolah mula dan sekolah destinasi.')
      return
    }
    if (sekolahMula === sekolahDestinasi) {
        setError('Sekolah mula dan destinasi tidak boleh sama.')
        return
    }

    // 2. Set status loading & reset hasil lama
    setIsLoading(true)
    setError(null)
    setDistance(null)
    setCost(null)

    try {
      // 3. Hantar permintaan (request) ke API route kita
      const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          sekolahMula, 
          sekolahDestinasi,
          waypoints: waypoints.filter(w => w && w.trim()), // Only send non-empty waypoints
          optimizeRoute // Include route optimization preference
        }),
      })

      const data = await response.json()

      // 4. Periksa jika ada ralat dari API
      if (!response.ok) {
        throw new Error(data.error || 'Sesuatu yang tidak kena telah berlaku.')
      }

      // 5. Jika berjaya, kira kos dan kemas kini state
      const calculatedDistance = data.distance
      const calculatedCost = calculatedDistance * parseFloat(kadar)
      setDistance(calculatedDistance)
      setCost(calculatedCost)
      setRouteDetails(data) // Store full route details

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Sesuatu yang tidak kena telah berlaku.'
      setError(errorMessage)
    } finally {
      // 6. Hentikan status loading, tidak kira berjaya atau gagal
      setIsLoading(false)
    }
  }
  // ===============================================================

  // === RESET FUNCTION ===
  const handleReset = () => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      'Adakah anda pasti mahu mereset semua maklumat?\n\n' +
      'Ini akan membuang:\n' +
      '• Sekolah mula dan destinasi\n' +
      '• Semua destinasi perantaraan\n' +
      '• Hasil pengiraan\n' +
      '• Kadar perbatuan akan reset ke RM 0.70'
    )
    
    if (!confirmed) return
    
    // Clear all selections
    setSekolahMula('')
    setSekolahDestinasi('')
    setWaypoints([])
    setKadar('0.70')
    
    // Clear all search states
    setSearchMula('')
    setSearchDestinasi('')
    setSearchWaypoints([])
    setSearchResultsMula([])
    setSearchResultsDestinasi([])
    setSearchResultsWaypoints([])
    
    // Clear waypoint UI states
    setOpenMula(false)
    setOpenDestinasi(false)
    setOpenWaypoints([])
    setIsSearchingMula(false)
    setIsSearchingDestinasi(false)
    setIsSearchingWaypoints([])
    
    // Clear results and errors
    setDistance(null)
    setCost(null)
    setRouteDetails(null)
    setError(null)
    setIsLoading(false)
    
    console.log('🔄 Form reset completed')
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
      {/* Header Section */}
      <div className="text-center space-y-3 sm:space-y-4">
        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg mb-3 sm:mb-4">
          <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
          MyJN@Jarak
        </h1>
        <p className="text-sm sm:text-base lg:text-lg text-slate-600 max-w-2xl mx-auto px-4">
          Sistem pengiraan jarak dan kos perjalanan antara sekolah dengan ketepatan tinggi menggunakan teknologi pemetaan canggih
        </p>
      </div>

      {/* Main Calculator Card */}
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-slate-50 rounded-t-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
            <div>
              <CardTitle className="text-xl sm:text-2xl text-slate-800">Pengiraan Perjalanan</CardTitle>
              <CardDescription className="text-sm sm:text-base text-slate-600 mt-1">Pilih sekolah mula dan destinasi untuk memulakan pengiraan.</CardDescription>
            </div>
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 border-red-200 hover:border-red-300 hover:bg-red-50 text-red-600 hover:text-red-700 transition-all duration-200 self-start sm:self-auto"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset
            </Button>
          </div>
        </CardHeader>
      <CardContent className="p-4 sm:p-6 lg:p-8">
        <div className="grid gap-6 sm:gap-8">
          {/* PEMILIH SEKOLAH MULA */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
              <Label htmlFor="sekolah-mula" className="text-sm sm:text-base font-semibold text-slate-700 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Sekolah Mula
              </Label>
              {sekolahMula && (
                <Button 
                  type="button"
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setSekolahMula('')
                    setSearchMula('')
                    setSearchResultsMula([])
                  }}
                  className="text-red-500 hover:text-red-700 text-xs p-1 h-6"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              )}
            </div>
            <Popover open={openMula} onOpenChange={setOpenMula}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={openMula} className="w-full justify-between h-10 sm:h-12 border-2 border-slate-200 hover:border-blue-300 focus:border-blue-500 transition-all duration-200 bg-white/50 text-sm sm:text-base">
                  {sekolahMula || 'Pilih sekolah mula...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[300px] sm:max-h-[--radix-popover-content-available-height] p-0">
                <Command shouldFilter={false}>
                  <CommandInput 
                    placeholder="Taip untuk cari sekolah..." 
                    value={searchMula}
                    onValueChange={setSearchMula}
                    className="text-sm sm:text-base"
                  />
                  <CommandEmpty>
                    {searchMula.length < 2 
                      ? 'Taip sekurang-kurangnya 2 huruf untuk carian'
                      : isSearchingMula 
                        ? 'Mencari...'
                        : 'Tiada sekolah dijumpai'
                    }
                  </CommandEmpty>
                  <CommandGroup>
                    {isSearchingMula && (
                      <CommandItem disabled>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Mencari sekolah...
                      </CommandItem>
                    )}
                    {searchResultsMula.map((sekolah) => (
                      <CommandItem
                        key={sekolah.id}
                        value={sekolah.nama_sekolah}
                        onSelect={(currentValue) => {
                          setSekolahMula(currentValue)
                          setOpenMula(false)
                          setSearchMula('')
                        }}
                      >
                        <Check className={cn('mr-2 h-4 w-4', sekolahMula === sekolah.nama_sekolah ? 'opacity-100' : 'opacity-0')} />
                        {sekolah.nama_sekolah}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* PEMILIH SEKOLAH DESTINASI */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="sekolah-destinasi" className="text-base font-semibold text-slate-700 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Sekolah Destinasi
              </Label>
              {sekolahDestinasi && (
                <Button 
                  type="button"
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    setSekolahDestinasi('')
                    setSearchDestinasi('')
                    setSearchResultsDestinasi([])
                  }}
                  className="text-red-500 hover:text-red-700 text-xs p-1 h-6"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              )}
            </div>
              <Popover open={openDestinasi} onOpenChange={setOpenDestinasi}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={openDestinasi} className="w-full justify-between h-12 border-2 border-slate-200 hover:border-green-300 focus:border-green-500 transition-all duration-200 bg-white/50">
                  {sekolahDestinasi || 'Pilih sekolah destinasi...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
                <Command shouldFilter={false}>
                  <CommandInput 
                    placeholder="Taip untuk cari sekolah..." 
                    value={searchDestinasi}
                    onValueChange={setSearchDestinasi}
                  />
                  <CommandEmpty>
                    {searchDestinasi.length < 2 
                      ? 'Taip sekurang-kurangnya 2 huruf untuk carian'
                      : isSearchingDestinasi 
                        ? 'Mencari...'
                        : 'Tiada sekolah dijumpai'
                    }
                  </CommandEmpty>
                  <CommandGroup>
                    {isSearchingDestinasi && (
                      <CommandItem disabled>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Mencari sekolah...
                      </CommandItem>
                    )}
                    {searchResultsDestinasi.map((sekolah) => (
                      <CommandItem
                        key={sekolah.id}
                        value={sekolah.nama_sekolah}
                        onSelect={(currentValue) => {
                          setSekolahDestinasi(currentValue)
                          setOpenDestinasi(false)
                          setSearchDestinasi('')
                        }}
                      >
                        <Check className={cn('mr-2 h-4 w-4', sekolahDestinasi === sekolah.nama_sekolah ? 'opacity-100' : 'opacity-0')} />
                        {sekolah.nama_sekolah}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* WAYPOINTS SECTION */}
          {waypoints.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold text-slate-700 flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  Destinasi Perantaraan ({waypoints.length})
                </Label>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setWaypoints([])}
                  className="text-red-500 hover:text-red-700 text-xs"
                >
                  Buang Semua
                </Button>
              </div>
              
              {waypoints.map((waypoint, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1 space-y-2">
                    <Label className="text-sm text-slate-600">
                      Destinasi {index + 1}
                    </Label>
                    <Popover open={openWaypoints[index] || false} onOpenChange={(open) => {
                      const newOpen = [...openWaypoints];
                      newOpen[index] = open;
                      setOpenWaypoints(newOpen);
                    }}>
                      <PopoverTrigger asChild>
                        <Button 
                          variant="outline" 
                          role="combobox" 
                          className="w-full justify-between h-11 border-2 border-slate-200 hover:border-purple-300 focus:border-purple-500 transition-all duration-200 bg-white/50"
                        >
                          {waypoint || `Pilih destinasi ${index + 1}...`}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
                        <Command shouldFilter={false}>
                          <CommandInput 
                            placeholder="Taip untuk cari sekolah..." 
                            value={searchWaypoints[index] || ''}
                            onValueChange={(value) => {
                              const newSearch = [...searchWaypoints];
                              newSearch[index] = value;
                              setSearchWaypoints(newSearch);
                            }}
                          />
                          <CommandEmpty>
                            {(searchWaypoints[index]?.length || 0) < 2 
                              ? 'Taip sekurang-kurangnya 2 huruf untuk carian'
                              : isSearchingWaypoints[index] 
                                ? 'Mencari...'
                                : 'Tiada sekolah dijumpai'
                            }
                          </CommandEmpty>
                          <CommandGroup>
                            {isSearchingWaypoints[index] && (
                              <CommandItem disabled>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Mencari sekolah...
                              </CommandItem>
                            )}
                            {(searchResultsWaypoints[index] || []).map((sekolah) => (
                              <CommandItem
                                key={sekolah.id}
                                value={sekolah.nama_sekolah}
                                onSelect={(currentValue) => {
                                  const newWaypoints = [...waypoints];
                                  newWaypoints[index] = currentValue;
                                  setWaypoints(newWaypoints);
                                  
                                  const newOpen = [...openWaypoints];
                                  newOpen[index] = false;
                                  setOpenWaypoints(newOpen);
                                  
                                  const newSearch = [...searchWaypoints];
                                  newSearch[index] = '';
                                  setSearchWaypoints(newSearch);
                                }}
                              >
                                <Check className={cn('mr-2 h-4 w-4', waypoint === sekolah.nama_sekolah ? 'opacity-100' : 'opacity-0')} />
                                {sekolah.nama_sekolah}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <Button 
                    type="button"
                    variant="outline" 
                    size="sm"
                    onClick={() => removeWaypoint(index)}
                    className="h-11 w-11 p-0 border-red-200 hover:border-red-300 hover:bg-red-50"
                  >
                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* ADD WAYPOINT BUTTON */}
          <div className="flex justify-center">
            <Button 
              type="button"
              variant="outline" 
              onClick={addWaypoint}
              disabled={waypoints.length >= 8}
              className="flex items-center gap-2 border-dashed border-2 border-slate-300 hover:border-blue-400 hover:bg-blue-50 transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {waypoints.length === 0 ? 'Tambah Destinasi Perantaraan' : 'Tambah Lagi Destinasi'}
              {waypoints.length >= 8 && <span className="text-xs">(Maksimum 8)</span>}
            </Button>
          </div>

          {/* INPUT KADAR PERBATUAN */}
          <div className="space-y-3">
            <Label htmlFor="kadar" className="text-base font-semibold text-slate-700 flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              Kadar Perbatuan (RM / km)
            </Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 font-medium">RM</span>
              <Input 
                id="kadar" 
                type="number" 
                placeholder="0.70" 
                value={kadar} 
                onChange={(e) => setKadar(e.target.value)}
                className="pl-12 h-12 border-2 border-slate-200 focus:border-amber-500 transition-all duration-200 bg-white/50"
              />
            </div>
          </div>

          {/* ROUTE OPTIMIZATION TOGGLE */}
          {waypoints.length > 0 && (
            <div className="space-y-3 bg-purple-50/50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <div>
                    <Label className="text-base font-semibold text-slate-700">
                      Optimasi Laluan Pintar
                    </Label>
                    <p className="text-sm text-slate-600 mt-1">
                      Automatik cari laluan terpendek untuk mengelak &ldquo;patah balik&rdquo;
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={optimizeRoute}
                    onChange={(e) => setOptimizeRoute(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
              
              {optimizeRoute && (
                <div className="flex items-center gap-2 text-sm text-purple-700 bg-purple-100 p-3 rounded-md">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span><strong>Aktif!</strong> Sistem akan mengira laluan paling efisien antara semua destinasi</span>
                </div>
              )}
            </div>
          )}

          {/* === BAHAGIAN DIUBAHSUAI: Butang Kira dengan status loading === */}
          <div className="pt-3 sm:pt-4">
            <Button 
              onClick={handleKira} 
              disabled={isLoading}
              className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  <span className="hidden sm:inline">Mengira perjalanan...</span>
                  <span className="sm:hidden">Mengira...</span>
                </>
              ) : (
                <>
                  <svg className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span className="hidden sm:inline">Kira Jarak & Kos Perjalanan</span>
                  <span className="sm:hidden">Kira Jarak & Kos</span>
                </>
              )}
            </Button>
          </div>
          {/* =============================================================== */}
        </div>
      </CardContent>
      
      {/* === BAHAGIAN BARU: Ruang untuk memaparkan hasil dan ralat === */}
      <CardFooter className="flex-col items-start gap-4 sm:gap-6 p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-blue-50/50">
        {error && (
          <div className="w-full p-6 rounded-xl bg-gradient-to-r from-red-50 to-red-100 border-l-4 border-red-500 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-bold text-red-800">Ralat Berlaku</p>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {distance !== null && cost !== null && (
          <div className="w-full space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-slate-800 mb-2">Hasil Pengiraan</h3>
              <div className="w-20 h-1 bg-gradient-to-r from-blue-500 to-green-500 rounded-full mx-auto"></div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {/* Jarak Card */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Jarak Pemanduan</p>
                    <p className="text-3xl font-bold mt-1">{distance.toFixed(2)}</p>
                    <p className="text-blue-100 text-lg">kilometer</p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Kos Card */}
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-6 rounded-xl text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Anggaran Kos (Sehala)</p>
                    <p className="text-3xl font-bold mt-1">RM {cost.toFixed(2)}</p>
                    <p className="text-green-100 text-lg">ringgit</p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="bg-white/70 backdrop-blur-sm p-4 rounded-lg border border-slate-200 mt-4">
              <div className="flex items-center justify-center gap-4 text-sm text-slate-600 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-amber-400 rounded-full"></div>
                  <span>Kadar: RM {kadar}/km</span>
                </div>
                <div className="w-px h-4 bg-slate-300"></div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                  <span>Pergi & balik: RM {(cost * 2).toFixed(2)}</span>
                </div>
                {routeDetails?.waypoints_used > 0 && (
                  <>
                    <div className="w-px h-4 bg-slate-300"></div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                      <span>{routeDetails.waypoints_used} destinasi perantaraan</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Route Optimization Results */}
            {routeDetails?.optimization && routeDetails.optimization.enabled && (
              <div className="bg-white/70 backdrop-blur-sm p-6 rounded-lg border border-slate-200 mt-4">
                <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Optimasi Laluan Pintar
                </h4>
                
                {routeDetails.optimization.distance_saved > 0 ? (
                  <div className="space-y-4">
                    {/* Savings Summary */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-green-800 font-semibold">Jarak Dijimatkan</p>
                            <p className="text-2xl font-bold text-green-600">{routeDetails.optimization.distance_saved.toFixed(2)} km</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-blue-800 font-semibold">Penjimatan</p>
                            <p className="text-2xl font-bold text-blue-600">{routeDetails.optimization.percentage_saved.toFixed(1)}%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Route Comparison */}
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Original Route */}
                      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                        <h5 className="font-semibold text-red-800 mb-2">Laluan Asal (Sequential)</h5>
                        <div className="space-y-2">
                          {routeDetails.optimization.original_order.map((school: string, index: number) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-red-500' : index === routeDetails.optimization.original_order.length - 1 ? 'bg-red-600' : 'bg-red-400'}`}></div>
                              <span className="text-red-700">{school}</span>
                            </div>
                          ))}
                          <div className="mt-3 pt-2 border-t border-red-200">
                            <p className="text-sm text-red-600">
                              <strong>Jumlah: {routeDetails.optimization.original_total_distance.toFixed(2)} km</strong>
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Optimized Route */}
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h5 className="font-semibold text-green-800 mb-2">Laluan Optimum (Pintar)</h5>
                        <div className="space-y-2">
                          {routeDetails.optimization.optimized_order.map((school: string, index: number) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                              <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-green-500' : index === routeDetails.optimization.optimized_order.length - 1 ? 'bg-green-600' : 'bg-green-400'}`}></div>
                              <span className="text-green-700">{school}</span>
                            </div>
                          ))}
                          <div className="mt-3 pt-2 border-t border-green-200">
                            <p className="text-sm text-green-600">
                              <strong>Jumlah: {routeDetails.optimization.optimized_total_distance.toFixed(2)} km</strong>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-amber-700 bg-amber-50 p-4 rounded-lg border border-amber-200">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Laluan semasa sudah optimum - tiada penambahbaikan diperlukan.</span>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons for Results */}
            <div className="bg-white/70 backdrop-blur-sm p-6 rounded-lg border border-slate-200 mt-4">
              <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Export & Cetak Laporan
              </h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                {/* Print Report */}
                <Button 
                  onClick={() => openPrintReport({
                    distance: distance!,
                    cost: cost!,
                    rate: kadar,
                    routeDetails,
                    sekolahMula,
                    sekolahDestinasi,
                    waypoints
                  })}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 text-sm sm:px-4 sm:text-base"
                >
                  <Printer className="w-4 h-4" />
                  Cetak Laporan
                </Button>

                {/* Export CSV */}
                <Button 
                  onClick={() => exportAsCSV({
                    distance: distance!,
                    cost: cost!,
                    rate: kadar,
                    routeDetails,
                    sekolahMula,
                    sekolahDestinasi,
                    waypoints
                  })}
                  variant="outline"
                  className="flex items-center gap-2 border-green-500 text-green-600 hover:bg-green-50 px-3 py-2 text-sm sm:px-4 sm:text-base"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </Button>

                {/* Export JSON */}
                <Button 
                  onClick={() => exportAsJSON({
                    distance: distance!,
                    cost: cost!,
                    rate: kadar,
                    routeDetails,
                    sekolahMula,
                    sekolahDestinasi,
                    waypoints
                  })}
                  variant="outline"
                  className="flex items-center gap-2 border-purple-500 text-purple-600 hover:bg-purple-50 px-3 py-2 text-sm sm:px-4 sm:text-base"
                >
                  <FileText className="w-4 h-4" />
                  Export JSON
                </Button>
              </div>
              
              <div className="mt-3 text-sm text-slate-600 text-center">
                💡 <strong>Tip:</strong> Cetak untuk presentasi, CSV untuk Excel, JSON untuk sistem lain
              </div>
            </div>

            {/* Route Breakdown - Show when waypoints exist */}
            {routeDetails?.legs && routeDetails.legs.length > 1 && (
              <div className="bg-white/70 backdrop-blur-sm p-6 rounded-lg border border-slate-200 mt-4">
                <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Pecahan Perjalanan
                </h4>
                <div className="space-y-3">
                  {routeDetails.legs.map((leg: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-blue-500' : index === routeDetails.legs.length - 1 ? 'bg-green-500' : 'bg-purple-500'}`}></div>
                          <span className="text-sm font-medium text-slate-700">
                            {leg.from} → {leg.to}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-slate-800">
                          {leg.distance_km.toFixed(2)} km
                        </div>
                        <div className="text-xs text-slate-500">
                          RM {(leg.distance_km * parseFloat(kadar)).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 pt-3 border-t border-slate-200">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-700">Jumlah Keseluruhan:</span>
                    <div className="text-right">
                      <div className="text-lg font-bold text-slate-800">{distance.toFixed(2)} km</div>
                      <div className="text-sm text-slate-600">RM {cost.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardFooter>
      {/* =============================================================== */}
    </Card>
    </div>
  )
}