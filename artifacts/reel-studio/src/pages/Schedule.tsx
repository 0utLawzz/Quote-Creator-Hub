import * as React from "react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Trash2, Link as LinkIcon, Instagram, Facebook, Twitter, Linkedin, Video } from "lucide-react";
import { useListSchedules, useCreateSchedule, useDeleteSchedule, useListReels } from "@workspace/api-client-react";
import { getListSchedulesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { scheduleReelSchema } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PLATFORMS = [
  { id: "instagram", name: "Instagram", icon: Instagram, color: "text-pink-500" },
  { id: "tiktok", name: "TikTok", icon: Video, color: "text-black dark:text-white" },
  { id: "twitter", name: "Twitter/X", icon: Twitter, color: "text-sky-500" },
  { id: "facebook", name: "Facebook", icon: Facebook, color: "text-blue-600" },
  { id: "linkedin", name: "LinkedIn", icon: Linkedin, color: "text-blue-700" },
];

export default function Schedule() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const { data: schedules, isLoading: loadingSchedules } = useListSchedules();
  const { data: reels, isLoading: loadingReels } = useListReels({ status: "draft" }); // mainly schedule drafts

  const createSchedule = useCreateSchedule({
    mutation: {
      onSuccess: () => {
        toast({ title: "Reel scheduled successfully!" });
        queryClient.invalidateQueries({ queryKey: getListSchedulesQueryKey() });
        setIsDialogOpen(false);
      },
      onError: () => {
        toast({ variant: "destructive", title: "Failed to schedule reel" });
      }
    }
  });

  const deleteSchedule = useDeleteSchedule({
    mutation: {
      onSuccess: () => {
        toast({ title: "Schedule cancelled" });
        queryClient.invalidateQueries({ queryKey: getListSchedulesQueryKey() });
      }
    }
  });

  const form = useForm({
    resolver: zodResolver(scheduleReelSchema),
    defaultValues: {
      reelId: undefined,
      platform: "",
      scheduledAt: new Date().toISOString(),
    }
  });

  function onSubmit(data: any) {
    createSchedule.mutate({ data });
  }

  // Sort schedules chronologically
  const sortedSchedules = schedules?.slice().sort((a, b) => 
    new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  ) || [];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Content Schedule</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Plan and automate your cinematic quotes across platforms.
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="font-semibold shadow-primary/25 shadow-lg">
              <CalendarIcon className="mr-2 h-4 w-4" />
              Schedule Post
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Schedule Reel</DialogTitle>
              <DialogDescription>
                Select a reel and choose when and where it should be posted.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                <FormField
                  control={form.control}
                  name="reelId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Reel</FormLabel>
                      <Select 
                        onValueChange={(val) => field.onChange(parseInt(val))} 
                        value={String(field.value ?? "")}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a reel..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {reels?.map(r => (
                            <SelectItem key={r.id} value={r.id.toString()}>
                              {r.quote.substring(0, 40)}...
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="platform"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Platform</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select platform..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PLATFORMS.map(p => (
                            <SelectItem key={p.id} value={p.id}>
                              <div className="flex items-center gap-2">
                                <p.icon className={cn("h-4 w-4", p.color)} />
                                {p.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="scheduledAt"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Schedule Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal bg-card/50",
                                !selectedDate && "text-muted-foreground"
                              )}
                            >
                              {selectedDate ? (
                                format(selectedDate, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={(date) => {
                              setSelectedDate(date);
                              if (date) {
                                // Default to noon for simplicity, or preserve time if existing
                                const newDate = new Date(date);
                                newDate.setHours(12, 0, 0, 0);
                                field.onChange(newDate.toISOString());
                              }
                            }}
                            disabled={(date) =>
                              date < new Date(new Date().setHours(0, 0, 0, 0))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full mt-4" disabled={createSchedule.isPending}>
                  {createSchedule.isPending ? "Scheduling..." : "Confirm Schedule"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {loadingSchedules ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
          </div>
        ) : sortedSchedules.length > 0 ? (
          <div className="divide-y divide-border">
            {sortedSchedules.map((schedule) => {
              const platform = PLATFORMS.find(p => p.id === schedule.platform) || PLATFORMS[0];
              const PlatformIcon = platform.icon;
              const date = new Date(schedule.scheduledAt);
              
              return (
                <div key={schedule.id} className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center justify-center bg-background border border-border rounded-lg h-14 w-14 shrink-0">
                      <span className="text-xs font-semibold text-muted-foreground uppercase">{format(date, "MMM")}</span>
                      <span className="text-xl font-bold leading-none">{format(date, "d")}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={cn("bg-background gap-1.5", platform.color)}>
                          <PlatformIcon className="h-3 w-3" />
                          {platform.name}
                        </Badge>
                        <span className="text-sm font-medium text-muted-foreground">
                          {format(date, "h:mm a")}
                        </span>
                        <Badge variant={schedule.status === 'posted' ? 'default' : 'secondary'} className="text-[10px] h-5 uppercase">
                          {schedule.status}
                        </Badge>
                      </div>
                      <p className="font-serif font-medium line-clamp-1 text-foreground/90">
                        {schedule.reel ? `"${schedule.reel.quote}"` : "Reel missing or deleted"}
                      </p>
                    </div>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => {
                      if (confirm("Cancel this schedule?")) {
                        deleteSchedule.mutate({ id: schedule.id });
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center flex flex-col items-center">
            <CalendarIcon className="h-12 w-12 text-muted-foreground opacity-30 mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-1">No scheduled posts</h3>
            <p className="text-muted-foreground">You don't have any reels queued up for publishing.</p>
          </div>
        )}
      </div>
    </div>
  );
}
