"use client";

import Image from "next/image";
import { Card } from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { useQuery } from "@tanstack/react-query";
import { getPlayerInfoById } from "@/actions/player.action";
import { Button } from "../ui/button";
import { Search } from "lucide-react";

type PlayerInfoCardProps = {
  clientId: string | null;
  setOpenDialog: (open: boolean) => void;
};

export default function PlayerInfoCard({ clientId, setOpenDialog }: PlayerInfoCardProps) {
  const { data: playerData } = useQuery({
    queryKey: ["playerInfo", clientId],
    queryFn: async () => getPlayerInfoById(clientId!),
    enabled: !!clientId,
  })

  return (
    <Card className="w-full flex flex-row items-stretch p-4">
      <div className="flex-1 flex justify-center">
        {playerData?.picture_url ? (
          <Image
            src={playerData.picture_url}
            alt={`${playerData.firstname} ${playerData.lastname}`}
            width={160}
            height={160}
            className="rounded-md object-cover"
            loading="eager"
          />
        ) : (
          <div className="w-40 h-40 rounded-md flex items-center justify-center">
            <span className="text-white text-3xl font-bold">
              {playerData?.firstname.charAt(0)}{playerData?.lastname.charAt(0)}
            </span>
          </div>
        )}
      </div>
      <div className="flex-2 ml-4">
        <div className="grid grid-cols-3 gap-2">
          <Label>Client ID</Label>
          <Input className="col-span-2" value={playerData?.client_id || ""} readOnly />
          <Label>First Name</Label>
          <Input className="col-span-2" value={playerData?.firstname || ""} readOnly />
          <Label>Last Name</Label>
          <Input className="col-span-2" value={playerData?.lastname || ""} readOnly />
          <Label>Birthdate</Label>
          <Input className="col-span-2" value={playerData?.birth_date?.toLocaleDateString("en-US") || ""} readOnly />
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground h-40">
        <Button variant="outline" size="lg" className="text-lg" onClick={() => setOpenDialog(true)}>
          <Search className="mr-2 h-4 w-4" />
          Search
        </Button>
      </div>
    </Card>
  );
}