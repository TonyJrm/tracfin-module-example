"use client";

import SummaryTable from "@/components/tables/summary-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import { getPlayerSummary } from "@/actions/player.action";
import { DateFilters } from "@/components/cards/filter-bar";

type SummaryViewProps = {
  clientId: string;
  filters: DateFilters;
};

export default function SummaryView({ clientId, filters }: SummaryViewProps) {
  const { data: summary, isLoading } = useQuery({
    queryKey: ["playerSummary", clientId, filters.startDate.toISOString(), filters.endDate.toISOString()],
    queryFn: async () => getPlayerSummary(clientId, filters.startDate, filters.endDate),
    enabled: !!clientId,
  });

  if (isLoading) {
    return (
      <div className="gap-2 flex flex-col max-w-6xl mx-auto">
        <Card className="m-2">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Loading summary...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="gap-2 flex flex-col max-w-6xl mx-auto">
        <Card className="m-2">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">No summary data found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const cashdeskBalance = summary.cashdesk.purchased - summary.cashdesk.paidBack;
  const slotsBalance =
    summary.slots.bills +
    summary.slots.ticketsIn -
    summary.slots.ticketsOut -
    summary.slots.handpays;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) + " €";
  };

  const formatPoints = (points: number) => {
    return new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(points) + " pts";
  };

  return (
    <div className="gap-2 flex flex-col max-w-6xl mx-auto">
      <Card className="m-2">
        <CardHeader>
          <CardTitle>Cashdesk</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-row gap-4 items-center">
          <div className="flex-1">
            <div className="grid grid-cols-2 gap-4 w-full">
              <Label className="text-sm text-muted-foreground">Purchased</Label>
              <Input className="w-32" value={formatCurrency(summary.cashdesk.purchased)} readOnly />
              <Label className="text-sm text-muted-foreground">Paid back</Label>
              <Input className="w-32" value={formatCurrency(summary.cashdesk.paidBack)} readOnly />
            </div>
          </div>
          <div className="flex-1">
            <div className="grid grid-cols-2 gap-4 w-full">
              <Label className="text-lg text-muted-foreground">Balance</Label>
              <Input className="w-32" value={formatCurrency(cashdeskBalance)} readOnly />
            </div>
          </div>
          <div className="flex-1">
            <SummaryTable client_id={clientId} filters={filters} />
          </div>
        </CardContent>
      </Card>
      <Card className="m-2">
        <CardHeader>
          <CardTitle>Slots</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-row items-center">
            <div className="flex-1">
              <div className="grid grid-cols-2 gap-4 w-full">
                <Label className="text-sm text-muted-foreground">Bills</Label>
                <Input className="w-32" value={formatCurrency(summary.slots.bills)} readOnly />
                <Label className="text-sm text-muted-foreground">Tickets In</Label>
                <Input className="w-32" value={formatCurrency(summary.slots.ticketsIn)} readOnly />
                <Label className="text-sm text-muted-foreground">Tickets Out</Label>
                <Input className="w-32" value={formatCurrency(summary.slots.ticketsOut)} readOnly />
                <Label className="text-sm text-muted-foreground">Handpays</Label>
                <Input className="w-32" value={formatCurrency(summary.slots.handpays)} readOnly />
              </div>
            </div>
            <div className="flex-1">
              <div className="grid grid-cols-2 gap-4 w-full">
                <Label className="text-lg text-muted-foreground">Balance</Label>
                <Input className="w-32" value={formatCurrency(slotsBalance)} readOnly />
              </div>
            </div>
          </div>
          <div className="gap-0 text-muted-foreground italic">
            <p>These data came from:</p>
            <p>- Bills: Amount of bills inserted in slots machines when player is authenticated.</p>
            <p>- Tickets In/out: Amount of tickets inserted or printed by slots machines when player is authenticated/tracked + the tickets issued or redeemed by cashdesk.</p>
            <p>- Handpays: Amount of payments in cash or checks from the cashdesk following a handpay assigned to this player.</p>
          </div>
        </CardContent>
      </Card>
      <Card className="m-2">
        <CardHeader>
          <CardTitle>Loyalty Card</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4 w-full">
          <div className="grid grid-cols-2">
            <Label className="text-sm text-muted-foreground">nb. of gaming sessions</Label>
            <Input className="w-32" value={summary.loyaltyCard.sessionsCount} readOnly />
          </div>
          <div className="grid grid-cols-2">
            <Label className="text-sm text-muted-foreground">Coin In</Label>
            <Input className="w-32" value={formatCurrency(summary.loyaltyCard.coinIn)} readOnly />
          </div>
          <div className="grid grid-cols-2">
            <Label className="text-sm text-muted-foreground">Points</Label>
            <Input className="w-32" value={formatPoints(summary.loyaltyCard.points)} readOnly />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}