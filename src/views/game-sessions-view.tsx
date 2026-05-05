"use client";

import { getGameSessionsByClientId } from "@/actions/game-sessions.action";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LOYALTY_RATIO } from "@/lib/rules";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

type GameSessionsViewProps = {
  client_id: string;
  filters: {
    startDate: Date;
    endDate: Date;
  };
};

export default function GameSessionsView({ client_id, filters }: GameSessionsViewProps) {
  const { data: gameSessionsData, isLoading } = useQuery({
    queryKey: ["gameSessions"],
    queryFn: async () => {
      return getGameSessionsByClientId(client_id, filters.startDate, filters.endDate);
    }
  });

  if (isLoading) {
    return (
      <Card className="m-2">
        <CardContent className="flex items-center">
          <Loader2 className="animate-spin h-5 w-5 mr-2" />
          <p className="text-sm text-gray-500">Loading game sessions...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="m-2">
      <CardHeader>
        <CardTitle>Game sessions</CardTitle>
        <CardDescription>Details of all gaming sessions during the specified period.
          Date, Machine number, Start time,
          End time, Coin in, Number of
          points won, Tickets inserted. The
          payout ratio is the number of points
          awarded relative to the coin in. </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Machine no.</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>End</TableHead>
              <TableHead>Coin in</TableHead>
              <TableHead>Points</TableHead>
              <TableHead>Ratio</TableHead>
              <TableHead className="text-right">Bills</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {gameSessionsData?.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.start_time.toLocaleDateString()}</TableCell>
                <TableCell>{row.machine_number}</TableCell>
                <TableCell>{row.start_time.toLocaleTimeString()}</TableCell>
                <TableCell>{row.end_time.toLocaleTimeString()}</TableCell>
                <TableCell>{Number(row.coin_in)} €</TableCell>
                <TableCell>{(Number(row.coin_in) * LOYALTY_RATIO).toFixed(2)}</TableCell>
                <TableCell>{LOYALTY_RATIO}</TableCell>
                <TableCell className="text-right">{Number(row.bills)} €</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}