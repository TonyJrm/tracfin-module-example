import { getPlayersPaginated } from "@/actions/player.action";
import { columns as playerColumns } from "@/components/tables/banks/player-list/columns";
import PlayerDataTable from "@/components/tables/banks/player-list/data-table";
import { columns as accountColumns } from "@/components/tables/banks/accounts-list/columns";
import AccountDataTable from "@/components/tables/banks/accounts-list/data-table";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { PlayerWithRelations } from "@/data/types";

const PAGE_SIZE = 100;

export default function BanksView() {
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerWithRelations | null>(null);

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ["banksViewPlayerList"],
    queryFn: async ({ pageParam }) => {
      const offset = (pageParam as number) || 0;
      const res = await getPlayersPaginated(PAGE_SIZE, offset);
      return res;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage?.hasMore) return undefined;
      return (allPages?.length || 0) * PAGE_SIZE;
    },
  });

  // Flatten toutes les pages en un seul array
  const allPlayers = useMemo(() => {
    return data?.pages.flatMap(page => page.players) ?? [];
  }, [data]);

  if (isLoading) {
    return (
      <div className="p-4">
        <Loader2 className="animate-spin h-6 w-6 text-gray-500 mx-auto" />
        <p className="text-sm text-gray-500 text-center mt-2">Loading players...</p>
      </div>
    );
  }

  if (allPlayers.length === 0) {
    return (
      <div className="p-4">
        <p className="text-sm text-gray-500 text-center">No players found.</p>
      </div>
    );
  }

  return (
    <div className="flex gap-4">
      <div className="flex-1 min-w-0">
        <PlayerDataTable
          columns={playerColumns}
          data={allPlayers}
          selectedClientId={selectedPlayer?.client_id}
          onRowClick={setSelectedPlayer}
          onLoadMore={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          hasMore={hasNextPage}
          isLoading={isFetchingNextPage}
        />
      </div>
      <div className="flex-1 min-w-0">
        <AccountDataTable
          columns={accountColumns}
          data={selectedPlayer?.banks ?? null}
        />
      </div>
    </div>
  );
}