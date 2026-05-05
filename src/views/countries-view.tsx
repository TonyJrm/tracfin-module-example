"use client";

import { useReducer, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { calculateCrossTab, getFilteredPlayers, type CrossTabData, type PaginatedPlayers } from "@/actions/countries.action";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";

interface ViewState {
  crossTabData: CrossTabData | null;
  selectedCell: { nationality: string; country: string } | null;
  playerData: PaginatedPlayers | null;
  isLoadingMatrix: boolean;
  isLoadingPlayers: boolean;
}

type ViewAction =
  | { type: 'START_LOAD_MATRIX' }
  | { type: 'SET_MATRIX'; payload: CrossTabData }
  | { type: 'START_LOAD_PLAYERS'; payload: { nationality: string; country: string } }
  | { type: 'SET_PLAYERS'; payload: PaginatedPlayers }
  | { type: 'CLEAR_SELECTION' };

const initialState: ViewState = {
  crossTabData: null,
  selectedCell: null,
  playerData: null,
  isLoadingMatrix: false,
  isLoadingPlayers: false,
};

function viewReducer(state: ViewState, action: ViewAction): ViewState {
  switch (action.type) {
    case 'START_LOAD_MATRIX':
      return { ...state, isLoadingMatrix: true };
    case 'SET_MATRIX':
      return {
        ...state,
        crossTabData: action.payload,
        isLoadingMatrix: false,
        selectedCell: null,
        playerData: null,
      };
    case 'START_LOAD_PLAYERS':
      return {
        ...state,
        selectedCell: action.payload,
        isLoadingPlayers: true,
      };
    case 'SET_PLAYERS':
      return {
        ...state,
        playerData: action.payload,
        isLoadingPlayers: false,
      };
    case 'CLEAR_SELECTION':
      return {
        ...state,
        selectedCell: null,
        playerData: null,
      };
    default:
      return state;
  }
}

export default function CountriesView() {
  const [state, dispatch] = useReducer(viewReducer, initialState);

  const headerScrollRef = useRef<HTMLDivElement>(null);
  const rowScrollRef = useRef<HTMLDivElement>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);
  const footerScrollRef = useRef<HTMLDivElement>(null);
  const rowTotalScrollRef = useRef<HTMLDivElement>(null);

  const handleBodyScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    if (headerScrollRef.current) {
      headerScrollRef.current.scrollLeft = target.scrollLeft;
    }
    if (rowScrollRef.current) {
      rowScrollRef.current.scrollTop = target.scrollTop;
    }
    if (footerScrollRef.current) {
      footerScrollRef.current.scrollLeft = target.scrollLeft;
    }
    if (rowTotalScrollRef.current) {
      rowTotalScrollRef.current.scrollTop = target.scrollTop;
    }
  };

  const handleCalculate = async () => {
    dispatch({ type: 'START_LOAD_MATRIX' });
    const data = await calculateCrossTab();
    dispatch({ type: 'SET_MATRIX', payload: data });
  };

  const handleCellClick = async (nationality: string, country: string) => {
    dispatch({ type: 'START_LOAD_PLAYERS', payload: { nationality, country } });
    const data = await getFilteredPlayers(nationality, country, 1, 10);
    dispatch({ type: 'SET_PLAYERS', payload: data });
  };

  const handlePageChange = async (page: number) => {
    if (!state.selectedCell) return;
    dispatch({ type: 'START_LOAD_PLAYERS', payload: state.selectedCell });
    const data = await getFilteredPlayers(
      state.selectedCell.nationality,
      state.selectedCell.country,
      page,
      10
    );
    dispatch({ type: 'SET_PLAYERS', payload: data });
  };

  const getCellCount = (nationality: string, country: string): number => {
    return state.crossTabData?.matrix[nationality]?.[country] || 0;
  };

  const getRowTotal = (country: string): number => {
    return state.crossTabData?.rowTotals[country] || 0;
  };

  const getColumnTotal = (nationality: string): number => {
    return state.crossTabData?.columnTotals[nationality] || 0;
  };

  const getGrandTotal = (): number => {
    return state.crossTabData?.grandTotal || 0;
  };

  return (
    <div className="p-4 space-y-4 flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
      <div className="flex items-center shrink-0">
        <Button onClick={handleCalculate} disabled={state.isLoadingMatrix}>
          {state.isLoadingMatrix && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {state.isLoadingMatrix ? "Calcul en cours..." : "Calculate"}
        </Button>
      </div>

      {!state.crossTabData && (
        <div className="text-center py-12 text-muted-foreground">
          Cliquez sur &quot;Calculate&quot; pour générer la matrice croisée
        </div>
      )}

      {state.crossTabData && (
        <div className="flex gap-4 min-h-0 flex-1">
          {/* Premier tableau: Matrice croisée avec scrolls synchronisés */}
          <div className="flex-1 border rounded-md overflow-hidden flex flex-col min-h-0">
            {/* Ligne du haut: Coin + Headers de colonnes + Header Total */}
            <div className="flex border-b border-border shrink-0">
              {/* Coin fixe */}
              <div className="w-32 shrink-0 border-r border-border bg-muted">
                <div className="h-10 flex items-center justify-center px-2 text-sm font-medium border-b border-border">
                  Pays / Nationalité
                </div>
              </div>

              {/* Headers de colonnes - scroll horizontal caché */}
              <div
                ref={headerScrollRef}
                className="flex-1 overflow-x-scroll overflow-y-hidden scrollbar-hide bg-muted"
              >
                <div className="flex h-10">
                  {state.crossTabData.nationalities.map((nationality) => (
                    <div
                      key={nationality}
                      className="w-32 shrink-0 flex items-center justify-center text-sm font-medium border-r border-border last:border-r-0"
                      style={{ width: '8rem' }}
                    >
                      {nationality}
                    </div>
                  ))}
                </div>
              </div>

              {/* Header Total - sticky right */}
              <div className="w-24 shrink-0 border-l border-border bg-muted">
                <div className="h-10 flex items-center justify-center text-sm font-bold">
                  Total
                </div>
              </div>
            </div>

            {/* Corps: Headers de lignes + Cellules + Totaux lignes */}
            <div className="flex flex-1 min-h-0">
              {/* Headers de lignes - scroll vertical caché */}
              <div
                ref={rowScrollRef}
                className="w-32 shrink-0 overflow-y-scroll overflow-x-hidden border-r border-border scrollbar-hide bg-muted"
              >
                {state.crossTabData.countries.map((country) => (
                  <div
                    key={country}
                    className="h-10 flex items-center px-2 text-sm font-medium border-b border-border last:border-b-0"
                  >
                    {country}
                  </div>
                ))}
              </div>

              {/* Corps avec cellules - scroll visible */}
              <div
                ref={bodyScrollRef}
                className="flex-1 scrollbar-always"
                style={{
                  overflow: 'auto',
                  scrollbarGutter: 'stable both-edges'
                }}
                onScroll={handleBodyScroll}
              >
                <div className="grid gap-0" style={{ gridTemplateColumns: `repeat(${state.crossTabData.nationalities.length}, 8rem)` }}>
                  {state.crossTabData.countries.flatMap((country) =>
                    state.crossTabData?.nationalities.map((nationality) => {
                      const count = getCellCount(nationality, country);
                      const isSelected =
                        state.selectedCell?.nationality === nationality &&
                        state.selectedCell?.country === country;

                      return (
                        <div
                          key={`${nationality}-${country}`}
                          className={`h-10 flex items-center justify-center border-r border-b border-border cursor-pointer transition-colors ${count > 0 ? "hover:bg-muted" : ""
                            } ${isSelected ? "bg-primary/10 font-bold" : ""}`}
                          onClick={() => {
                            if (count > 0) {
                              handleCellClick(nationality, country);
                            }
                          }}
                        >
                          {count > 0 ? count : ""}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Totaux lignes - sticky right, scroll vertical caché */}
              <div
                ref={rowTotalScrollRef}
                className="w-24 shrink-0 overflow-y-scroll overflow-x-hidden border-l border-border scrollbar-hide bg-muted"
              >
                {state.crossTabData.countries.map((country) => (
                  <div
                    key={country}
                    className="h-10 flex items-center justify-center text-sm font-bold border-b border-border last:border-b-0"
                  >
                    {getRowTotal(country)}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer: Total label + Totaux colonnes + Grand total */}
            <div className="flex border-t border-border shrink-0">
              {/* Coin footer */}
              <div className="w-32 shrink-0 border-r border-border bg-muted">
                <div className="h-10 flex items-center justify-center px-2 text-sm font-bold">
                  Total
                </div>
              </div>

              {/* Totaux colonnes - scroll horizontal caché */}
              <div
                ref={footerScrollRef}
                className="flex-1 overflow-x-scroll overflow-y-hidden scrollbar-hide bg-muted"
              >
                <div className="flex h-10">
                  {state.crossTabData.nationalities.map((nationality) => (
                    <div
                      key={nationality}
                      className="w-32 shrink-0 flex items-center justify-center text-sm font-bold border-r border-border last:border-r-0"
                      style={{ width: '8rem' }}
                    >
                      {getColumnTotal(nationality)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Grand total - sticky */}
              <div className="w-24 shrink-0 border-l border-border bg-muted">
                <div className="h-10 flex items-center justify-center text-sm font-bold">
                  {getGrandTotal()}
                </div>
              </div>
            </div>
          </div>

          <div className="w-96 shrink-0 flex flex-col min-h-0">
            {state.selectedCell ? (
              <div className="flex flex-col min-h-0">
                <h3 className="text-sm font-semibold mb-2 shrink-0">
                  {state.selectedCell.nationality} résidant en {state.selectedCell.country}
                  {state.playerData && (
                    <span className="ml-2 text-muted-foreground font-normal">
                      ({state.playerData.total} joueur{state.playerData.total > 1 ? 's' : ''})
                    </span>
                  )}
                </h3>
                {state.isLoadingPlayers ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : state.playerData ? (
                  <>
                    <div
                      className="border rounded-md scrollbar-always flex-1"
                      style={{
                        overflow: 'auto',
                        scrollbarGutter: 'stable both-edges'
                      }}
                    >
                      <Table className="border-collapse">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="sticky top-0 bg-muted z-10 border border-border">Nom</TableHead>
                            <TableHead className="sticky top-0 bg-muted z-10 border border-border">Prénom</TableHead>
                            <TableHead className="sticky top-0 bg-muted z-10 border border-border">Date de naissance</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {state.playerData.players.map((player) => (
                            <TableRow key={player.client_id}>
                              <TableCell className="border border-border">{player.lastname}</TableCell>
                              <TableCell className="border border-border">{player.firstname}</TableCell>
                              <TableCell className="border border-border">{player.birth_date.toLocaleDateString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {state.playerData.totalPages > 1 && (
                      <div className="flex items-center justify-between mt-2 shrink-0">
                        <div className="text-sm text-muted-foreground">
                          Page {state.playerData.page} / {state.playerData.totalPages}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(state.playerData!.page - 1)}
                            disabled={state.playerData.page === 1 || state.isLoadingPlayers}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(state.playerData!.page + 1)}
                            disabled={state.playerData.page === state.playerData.totalPages || state.isLoadingPlayers}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : null}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground text-sm">
                Cliquez sur une cellule du tableau pour voir les détails
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}