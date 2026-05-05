"use client";

import { useState, useReducer } from "react";
import FilterBar, { DateFilters } from "@/components/cards/filter-bar";
import PlayerInfoCard from "@/components/cards/player-info-card";
import MainComponent from "@/components/main-component";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import DatePickerInput from "@/components/custom/date-picker";
import { getPlayersBySearchCriteria } from "@/actions/player.action";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import Image from "next/image";

/** Local state shape for the player search dialog form fields. */
type SearchFormState = {
  lastName: string;
  firstName: string;
  birthDate: Date | undefined;
};

/** Discriminated union of actions accepted by the search form reducer. */
type SearchFormAction =
  | { type: 'SET_LAST_NAME'; payload: string }
  | { type: 'SET_FIRST_NAME'; payload: string }
  | { type: 'SET_BIRTH_DATE'; payload: Date | undefined }
  | { type: 'RESET_FORM' };

/**
 * Reducer for the player search form.
 * Using a reducer (vs. multiple useState calls) keeps all form state
 * co-located and makes RESET_FORM trivially cheap.
 */
function searchFormReducer(state: SearchFormState, action: SearchFormAction): SearchFormState {
  switch (action.type) {
    case 'SET_LAST_NAME':
      return { ...state, lastName: action.payload };
    case 'SET_FIRST_NAME':
      return { ...state, firstName: action.payload };
    case 'SET_BIRTH_DATE':
      return { ...state, birthDate: action.payload };
    case 'RESET_FORM':
      return { lastName: '', firstName: '', birthDate: undefined };
    default:
      return state;
  }
}

/**
 * Root page — entry point of the Tracfin surveillance module.
 *
 * Responsibilities:
 * - Holds the selected player (clientId) and the global date filters.
 * - Renders the player info card, the filter bar, and the tab view.
 * - Manages the player-search dialog (search by name / birth date).
 */
export default function Home() {
  const [openDialog, setOpenDialog] = useState(false);
  const [searchForm, dispatch] = useReducer(searchFormReducer, {
    lastName: '',
    firstName: '',
    birthDate: undefined,
  });
  // Flag flipped to true when the user clicks "Search"; TanStack Query uses it
  // as the `enabled` guard so the query only fires on explicit user action.
  const [searchInProgress, setSearchInProgress] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  // Default: last 30 days
  const [filters, setFilters] = useState<DateFilters>({
    startDate: new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(),
  });

  // The Search button is enabled when at least one field is filled in.
  const isSearchFormValid = searchForm.lastName.trim() !== '' ||
    searchForm.firstName.trim() !== '' ||
    searchForm.birthDate !== undefined;

  const { data: players, isLoading: isSearchLoading } = useQuery({
    queryKey: ["playerSearch", searchForm],
    queryFn: async () => {
      const res = await getPlayersBySearchCriteria(searchForm.firstName, searchForm.lastName, searchForm.birthDate);
      // Reset the flag after the query completes so a re-render doesn't
      // immediately re-trigger the query.
      setSearchInProgress(false);
      return res;
    },
    enabled: !!searchInProgress,
  });

  /** Triggers the TanStack Query by flipping the searchInProgress flag. */
  const handleSearch = async () => {
    setSearchInProgress(true);
  }

  /** Called when the user picks a player from the search results list. */
  const handleSelectPlayer = (clientId: string) => {
    setSelectedPlayerId(clientId);
    setOpenDialog(false);
    dispatch({ type: 'RESET_FORM' });
  }

  return (
    <div className="p-6 gap-2 flex flex-col max-w-6xl mx-auto">
      <PlayerInfoCard clientId={selectedPlayerId} setOpenDialog={setOpenDialog} />
      <FilterBar filters={filters} onFiltersChange={setFilters} />
      <MainComponent clientId={selectedPlayerId} filters={filters} />
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="min-w-2xl">
          <DialogHeader>
            <DialogTitle>Search Player</DialogTitle>
            <DialogDescription>Enter player details to search</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <FieldGroup>
              <Field>
                <Label htmlFor="last-name">Last name</Label>
                <Input
                  id="last-name"
                  name="lastName"
                  value={searchForm.lastName}
                  onChange={(e) => dispatch({ type: 'SET_LAST_NAME', payload: e.target.value })}
                />
              </Field>
              <Field>
                <Label htmlFor="first-name">First name</Label>
                <Input
                  id="first-name"
                  name="firstName"
                  value={searchForm.firstName}
                  onChange={(e) => dispatch({ type: 'SET_FIRST_NAME', payload: e.target.value })}
                />
              </Field>
              <Field>
                <Label htmlFor="birth-date">Birth date</Label>
                <DatePickerInput
                  value={searchForm.birthDate}
                  onChange={(date) => dispatch({ type: 'SET_BIRTH_DATE', payload: date })}
                />
              </Field>
            </FieldGroup>
            <div className="flex items-center justify-center">
              <Button
                size="lg"
                className="text-lg"
                disabled={!isSearchFormValid}
                onClick={handleSearch}
              >
                Search
              </Button>
            </div>
          </div>
          <Card className="-mx-4 no-scrollbar max-h-[50vh] overflow-y-auto px-4 bg-muted">
            {isSearchLoading ? (
              <>
                <Loader2 className="animate-spin h-6 w-6 text-muted-foreground mx-auto" />
                <p className="text-sm text-gray-500 text-center">Searching...</p>
              </>
            ) : players && players.length > 0 ? (
              <ul className="divide-y divide-border">
                {players.map((player) => (
                  <li
                    key={player.client_id}
                    className="flex gap-4 items-center w-full py-2 hover:bg-accent rounded-md cursor-pointer"
                    onClick={() => handleSelectPlayer(player.client_id)}
                  >
                    <Image
                      src={player.picture_url || "/placeholder-avatar.png"}
                      alt={`${player.firstname} ${player.lastname}`}
                      width={60}
                      height={60}
                      className="rounded-md object-cover flex-1"
                    />
                    <p className="text-sm font-medium flex-1">{player.firstname} {player.lastname}</p>
                    <p className="text-sm text-muted-foreground flex-1">Birthdate: {player.birth_date.toLocaleDateString()}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground text-center">No players found matching the criteria.</p>
            )}
          </Card>
        </DialogContent>
      </Dialog>
    </div>
  );
}
