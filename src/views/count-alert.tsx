"use client";

import { getCountAlertsByPlayer } from "@/actions/count-alert.action";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

type CountAlertProps = {
  client_id: string;
  filters: {
    startDate: Date;
    endDate: Date;
  };
}

export default function CountAlertView({ client_id, filters }: CountAlertProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["countAlerts", client_id, filters.startDate, filters.endDate],
    queryFn: async () => {
      const response = await getCountAlertsByPlayer(client_id, filters.startDate, filters.endDate);
      return response;
    }
  });

  if (isLoading) {
    return (
      <div className="p-4">
        <Loader2 className="animate-spin h-6 w-6 text-gray-500 mx-auto" />
        <p className="text-sm text-gray-500 text-center">Loading count alerts...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="p-4">
        <p className="text-sm text-gray-500 text-center">No count alerts found for this player.</p>
      </div>
    );
  }

  return (
    <Card className="m-2">
      <CardHeader>
        <CardTitle>Count Alert</CardTitle>
        <CardDescription>When an alert was triggered during the count process and was assigned to this player, it will be displayed here.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Machine no.</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.id}>
                <TableCell>{row.start_time.toLocaleDateString()}</TableCell>
                <TableCell>{row.machine_number}</TableCell>
                <TableCell className="text-right">{row.bills} €</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}