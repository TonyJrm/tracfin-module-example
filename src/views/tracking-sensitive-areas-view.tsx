/* eslint-disable react/no-children-prop */
"use client";

import { addSensitiveArea, deleteSensitiveArea, getPlayersInSensitiveAreas } from "@/actions/sensitive-areas.action";
import PlayersFoundDataTable from "@/components/tables/sensitive-areas/players-found-data-table";
import StreetsDataTable from "@/components/tables/sensitive-areas/streets-data-table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { sensitiveAreaFormSchema, SensitiveAreasResult } from "@/data/types";
import { useForm } from "@tanstack/react-form-nextjs";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Minus, Plus, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function TrackingSensitiveAreasView() {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedArea, setSelectedArea] = useState<SensitiveAreasResult['sensitive_areas'][number] | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['sensitive-areas'],
    queryFn: async () => {
      const res = await getPlayersInSensitiveAreas();
      return res;
    }
  });

  const form = useForm({
    defaultValues: {
      name: '',
      street: '',
      city: '',
    },
    validators: {
      onSubmit: sensitiveAreaFormSchema,
      onChange: sensitiveAreaFormSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await addSensitiveArea({
          name: value.name,
          street: value.street,
          city: value.city,
        });
        setOpenDialog(false);
        refetch();
        form.reset();
        toast.success("Sensitive area added successfully");
      } catch (error) {
        console.error("Error adding sensitive area:", error);
        toast.error("Failed to add sensitive area");
      }
    }
  });

  async function handleDelete() {
    if (!selectedArea) return;
    try {
      await deleteSensitiveArea(selectedArea.id);
      setSelectedArea(null);
      refetch();
      toast.success("Sensitive area deleted successfully");
    } catch (error) {
      console.error("Error deleting sensitive area:", error);
      toast.error("Failed to delete sensitive area");
    }
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <Loader2 className="animate-spin h-6 w-6 text-gray-500 mx-auto" />
        <p className="text-sm text-gray-500 text-center">Loading sensitive areas data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-sm text-red-500 text-center">Error loading sensitive areas data: {error instanceof Error ? error.message : 'Unknown error'}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-row p-4">
      {(!data || data.sensitive_areas.length === 0) && (
        <div className="flex flex-col items-center justify-center w-full p-4">
          <p className="text-sm text-gray-500">No sensitive areas data found.</p>
          <Button className="mt-4 mx-auto" onClick={() => setOpenDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add new area
          </Button>
        </div>
      )}


      {data && data.sensitive_areas.length > 0 && (
        <div className="flex flex-row gap-4 w-full">
          <StreetsDataTable
            data={data}
            onRowClick={(row) => setSelectedArea(row)}
            selectedId={selectedArea?.id}
          />
          <PlayersFoundDataTable data={data} />
          <div className="flex flex-col">
            <Button className="mb-2" onClick={() => setOpenDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New
            </Button>
            <Button onClick={handleDelete} disabled={!selectedArea}>
              <Minus className="mr-2 h-4 w-4" />
              Delete
            </Button>
            <Button onClick={() => refetch()}>
              <Search className="mr-2 h-4 w-4" />
              Search
            </Button>
          </div>
        </div>
      )}

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Sensitive Area</DialogTitle>
          </DialogHeader>
          <form
            id="add-new-sensitive-area"
            onSubmit={(e) => {
              e.preventDefault()
              form.handleSubmit()
            }}
          >
            <FieldGroup>
              <form.Field
                name="name"
                children={(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel>Name</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder="Enter the name"
                        autoComplete="off"
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  )
                }}
              />
              <form.Field
                name="street"
                children={(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel>Street</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder="Enter the street"
                        autoComplete="off"
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  )
                }}
              />
              <form.Field
                name="city"
                children={(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel>City</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder="Enter the city"
                        autoComplete="off"
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  )
                }}
              />
            </FieldGroup>
          </form>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => form.reset()}>
              Reset
            </Button>
            <Button type="submit" form="add-new-sensitive-area" disabled={form.state.isSubmitting || (form.state.isTouched && !form.state.isValid)}>
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}