/* eslint-disable react/no-children-prop */
"use client";

import { createRequisition, deleteRequisition, getAllRequisitions, markRequisitionAsFound, searchPlayersForRequisition } from "@/actions/requisitions.action";
import RequisitionsDataTable from "@/components/tables/requisitions/data-table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Requisition, requisitionFormSchema } from "@/data/types";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Minus, Plus, Search } from "lucide-react";
import { useState } from "react";
import { useForm } from "@tanstack/react-form-nextjs";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupText, InputGroupTextarea } from "@/components/ui/input-group";
import DatePickerInput from "@/components/custom/date-picker";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import Image from "next/image";

export default function TrackingRequisitionsView() {
  const [selectedRequisition, setSelectedRequisition] = useState<Requisition | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openSearchDialog, setOpenSearchDialog] = useState(false);


  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['tracking-requisitions'],
    queryFn: async () => {
      const res = await getAllRequisitions();
      return res;
    }
  });

  const { data: players, isLoading: isSearchLoading } = useQuery({
    queryKey: ['search-players', selectedRequisition?.requested_lastname, selectedRequisition?.requested_firstname, selectedRequisition?.requested_birth_date],
    queryFn: async () => {
      if (!selectedRequisition) return [];
      return await searchPlayersForRequisition(
        selectedRequisition.requested_lastname,
        selectedRequisition.requested_firstname,
        selectedRequisition.requested_birth_date
      );
    },
    enabled: openSearchDialog && !!selectedRequisition,
  });

  const form = useForm({
    defaultValues: {
      requested_firstname: "",
      requested_lastname: "",
      requested_birth_date: new Date(),
      added_at: new Date(),
      remarks: "",
    },
    validators: {
      onSubmit: requisitionFormSchema,
      onChange: requisitionFormSchema,
    },
    onSubmit: async (values) => {
      try {
        const newRequisition = await createRequisition(values.value);
        if (newRequisition) {
          form.reset();
          setOpenDialog(false);
          toast.success("Requisition created successfully");
          refetch();
        }
      } catch (error) {
        console.error("Error creating requisition:", error);
        toast.error("Failed to create requisition");
      }
    }
  });

  async function handleDeleteRequisition() {
    if (!selectedRequisition) return;
    try {
      await deleteRequisition(selectedRequisition.id);
      setSelectedRequisition(null);
      toast.success("Requisition deleted successfully");
      refetch();
    } catch (error) {
      console.error("Error deleting requisition:", error);
      toast.error("Failed to delete requisition");
    }
  }

  async function handleSelectPlayer(clientId: string) {
    try {
      await markRequisitionAsFound(selectedRequisition!.id, clientId);
      setSelectedRequisition(null);
      toast.success("Player assigned to requisition successfully");
      refetch();
    } catch (error) {
      console.error("Error assigning player to requisition:", error);
      toast.error("Failed to assign player to requisition");
    } finally {
      setOpenSearchDialog(false);
    }
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <Loader2 className="animate-spin h-6 w-6 text-muted-foreground mx-auto" />
        <p className="text-sm text-muted-foreground text-center">Loading tracking requisitions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-sm text-red-500 text-center">Error: {error instanceof Error ? error.message : "Unknown error"}</p>
      </div>
    );
  }

  return (
    <>
      <div className="gap-4 flex flex-row">
        <RequisitionsDataTable
          data={data}
          onRowClick={(row) => setSelectedRequisition(row)}
          selectedId={selectedRequisition?.id}
        />
        <div className="flex flex-col">
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                New
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form
                id="new-requisition-form"
                onSubmit={(e) => {
                  e.preventDefault()
                  form.handleSubmit()
                }}
              >
                <DialogHeader>
                  <DialogTitle>Requisition Details</DialogTitle>
                  <DialogDescription>
                    Please enter the details for the requisition.
                  </DialogDescription>
                </DialogHeader>
                <FieldGroup className="mt-4">
                  <form.Field
                    name="requested_lastname"
                    children={(field) => {
                      const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name}>Last name</FieldLabel>
                          <Input
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            aria-invalid={isInvalid}
                            placeholder="Enter last name"
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
                    name="requested_firstname"
                    children={(field) => {
                      const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name}>First name</FieldLabel>
                          <Input
                            id={field.name}
                            name={field.name}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            aria-invalid={isInvalid}
                            placeholder="Enter first name"
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
                    name="requested_birth_date"
                    children={(field) => {
                      const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name}>Birth date</FieldLabel>
                          <DatePickerInput
                            id={field.name}
                            name={field.name}
                            value={field.state.value instanceof Date ? field.state.value : undefined}
                            onChange={(date) => {
                              if (date) field.handleChange(date);
                            }}
                            onBlur={field.handleBlur}
                            captionLayout="dropdown"
                            startMonth={new Date(1920, 0)}
                            endMonth={new Date()}
                          />
                          {isInvalid && (
                            <FieldError errors={field.state.meta.errors} />
                          )}
                        </Field>
                      )
                    }}
                  />
                  <form.Field
                    name="remarks"
                    children={(field) => {
                      const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid
                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={field.name}>Remarks</FieldLabel>
                          <InputGroup>
                            <InputGroupTextarea
                              id={field.name}
                              name={field.name}
                              value={field.state.value}
                              onBlur={field.handleBlur}
                              onChange={(e) => field.handleChange(e.target.value)}
                              aria-invalid={isInvalid}
                              placeholder="Enter remarks"
                              autoComplete="off"
                            />
                            <InputGroupAddon align="block-end">
                              <InputGroupText className="tablular-nums">
                                {field.state.value.length}/255 characters
                              </InputGroupText>
                            </InputGroupAddon>
                          </InputGroup>
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
                <Button type="submit" form="new-requisition-form" disabled={!form.state.isValid}>
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button disabled={!selectedRequisition} onClick={handleDeleteRequisition}>
            <Minus className="mr-2 h-4 w-4" />
            Delete
          </Button>
          <Button disabled={!selectedRequisition || !!selectedRequisition.found_at} onClick={() => setOpenSearchDialog(true)}>
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
        </div>
      </div>
      <Dialog open={openSearchDialog} onOpenChange={setOpenSearchDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Search Results</DialogTitle>
            <DialogDescription>
              Players matching requisition criteria.
              Click on a player to assign.
            </DialogDescription>
          </DialogHeader>
          <Card className="-mx-4 no-scrollbar max-h-[50vh] overflow-y-auto px-4 bg-muted">
            {isSearchLoading ? (
              <>
                <Loader2 className="animate-spin h-6 w-6 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground text-center">Searching...</p>
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
          <DialogFooter>
            <Button onClick={() => setOpenSearchDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}