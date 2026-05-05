"use client";

import SummaryView from "@/views/summary-view";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import CountAlertView from "@/views/count-alert";
import GameSessionsView from "@/views/game-sessions-view";
import TitoView from "@/views/tito-view";
import CashTransactionsView from "@/views/cash-transactions-view";
import BwrView from "@/views/bwr-view";
import CountriesView from "@/views/countries-view";
import BanksView from "@/views/banks-view";
import ChecksCcView from "@/views/checks-cc-view";
import CsgView from "@/views/csg-view";
import ExchangeRegisterView from "@/views/exchange-register-view";
import TrackingRequisitionsView from "@/views/tracking-requisitions-view";
import TrackingSensitiveAreasView from "@/views/tracking-sensitive-areas-view";
import { DateFilters } from "@/components/cards/filter-bar";

type MainComponentProps = {
  /** UUID of the currently selected player. Null when no player is selected. */
  clientId: string | null;
  /** Global date range applied to all date-sensitive views. */
  filters: DateFilters;
};

/**
 * MainComponent — the tabbed view container for all surveillance modules.
 *
 * Each tab maps to a dedicated view component. The tab labels are responsive:
 * - xs / sm  → short abbreviation (e.g. "Sum")
 * - lg       → medium label      (e.g. "Summary")
 * - 3xl+     → full label        (e.g. "Summary")
 */
export default function MainComponent({ clientId, filters }: MainComponentProps) {
  // Tab definitions: three label lengths used by the responsive TabsTrigger below.
  const tabs = [
    { value: "summary", short: "Sum", medium: "Summary", full: "Summary" },
    { value: "count-alert", short: "Cnt", medium: "Count", full: "Count alert" },
    { value: "game-sessions", short: "Game", medium: "Sessions", full: "Game sessions" },
    { value: "tito", short: "TiTo", medium: "TiTo", full: "TiTo" },
    { value: "cash-transactions", short: "Cash", medium: "Cash Tr.", full: "Cash transactions" },
    { value: "bwr", short: "BWR", medium: "BWR", full: "BWR" },
    { value: "countries", short: "Ctry", medium: "Countries", full: "Countries" },
    { value: "banks", short: "Bnk", medium: "Banks", full: "Banks" },
    { value: "checks-cc", short: "Chk", medium: "Checks", full: "Checks/CC" },
    { value: "csg", short: "CSG", medium: "C.S.G", full: "C.S.G" },
    { value: "exchange-register", short: "Exch", medium: "Exchange", full: "Exchange register" },
    { value: "tracking-requisitions", short: "Req", medium: "Tracking R.", full: "Tracking requisitions" },
    { value: "tracking-sensitive-areas", short: "Sen", medium: "Tracking S.", full: "Tracking sensitive areas" },
  ];

  return (
    <div className="w-full overflow-x-auto mt-4">
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="inline-flex w-auto min-w-full sm:gap-0.5">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              className="text-[10px] px-1.5 py-1 sm:text-xs sm:px-2 sm:py-1.5 md:text-sm md:px-3 lg:text-base lg:px-4 whitespace-nowrap"
              value={tab.value}
            >
              <span className="lg:hidden">{tab.short}</span>
              <span className="hidden lg:inline 3xl:hidden lg:text-xs">{tab.medium}</span>
              <span className="hidden 3xl:inline 3xl:text-xs">{tab.full}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="summary" className="mt-4">
          <SummaryView clientId={clientId!} filters={filters} />
        </TabsContent>
        <TabsContent value="count-alert" className="mt-4">
          <CountAlertView client_id={clientId!} filters={filters} />
        </TabsContent>
        <TabsContent value="game-sessions" className="mt-4">
          <GameSessionsView client_id={clientId!} filters={filters} />
        </TabsContent>
        <TabsContent value="tito" className="mt-4">
          <TitoView client_id={clientId!} filters={filters} />
        </TabsContent>
        <TabsContent value="cash-transactions" className="mt-4">
          <CashTransactionsView client_id={clientId!} filters={filters} />
        </TabsContent>
        <TabsContent value="bwr" className="mt-4">
          <BwrView />
        </TabsContent>
        <TabsContent value="countries" className="mt-4">
          <CountriesView />
        </TabsContent>
        <TabsContent value="banks" className="mt-4">
          <BanksView />
        </TabsContent>
        <TabsContent value="checks-cc" className="mt-4">
          <ChecksCcView />
        </TabsContent>
        <TabsContent value="csg" className="mt-4">
          <CsgView />
        </TabsContent>
        <TabsContent value="exchange-register" className="mt-4">
          <ExchangeRegisterView />
        </TabsContent>
        <TabsContent value="tracking-requisitions" className="mt-4">
          <TrackingRequisitionsView />
        </TabsContent>
        <TabsContent value="tracking-sensitive-areas" className="mt-4">
          <TrackingSensitiveAreasView />
        </TabsContent>
      </Tabs>
    </div>
  )
}
