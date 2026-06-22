"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";

import { UserProvider, useUser } from "@/contexts/UserContext";
import { FormatProvider } from "@/contexts/FormatContext";
import { SidebarLeft } from "@/components/sidebar-left";
import { SidebarRight } from "@/components/sidebar-right";
import { type DateRange } from "react-day-picker";

import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbLink, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { AlertCircleIcon, ArrowLeft } from "lucide-react";
import { Spinner } from "@/components/ui/spinner"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import ProtectedPageWrapper from "@/components/protected-page-wrapper";

interface UserDetails {
  referenceid: string;
  tsm: string;
  manager: string;
  firstname?: string;
  lastname?: string;
}

function DetailContent() {
  const params = useParams();
  const router = useRouter();
  const { userId, setUserId } = useUser();
  const planId = params?.id as string;
  const isNew = planId === "new";

  const [userDetails, setUserDetails] = useState<UserDetails>({
    referenceid: "",
    tsm: "",
    manager: "",
  });
  const [loadingUser, setLoadingUser] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateCreatedFilterRange, setDateCreatedFilterRangeAction] = useState<DateRange | undefined>(undefined);

  // Fetch user details
  useEffect(() => {
    if (!userId) {
      setLoadingUser(false);
      return;
    }

    const fetchUserData = async () => {
      setError(null);
      setLoadingUser(true);
      try {
        const response = await fetch(`/api/user?id=${encodeURIComponent(userId)}`);
        if (!response.ok) throw new Error("Failed to fetch user data");
        const data = await response.json();

        setUserDetails({
          referenceid: data.ReferenceID || "",
          tsm: data.TSM || "",
          manager: data.Manager || "",
          firstname: data.FirstName || "",
          lastname: data.LastName || "",
        });
      } catch (err) {
        setError("Failed to fetch user data");
      } finally {
        setLoadingUser(false);
      }
    };

    fetchUserData();
  }, [userId]);

  const loading = loadingUser;

  return (
    <>
      <ProtectedPageWrapper>
        <SidebarLeft />
        <SidebarInset className="overflow-hidden">
          <header className="bg-background sticky top-0 flex h-14 shrink-0 items-center gap-2 border-b">
            <div className="flex flex-1 items-center gap-2 px-3">
              <SidebarTrigger />
              <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/roles/tsa/companies/account-development-plan" className="text-xs font-semibold uppercase tracking-wide">
                      Account Development Plan
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-xs font-semibold uppercase tracking-wide">
                      {isNew ? "New" : planId}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>

          <main className="flex flex-1 flex-col gap-4 p-4 overflow-auto">
            {loading ? (
              <div className="flex justify-center items-center py-10">
                <Spinner className="size-10" />
              </div>
            ) : (
              <>
                {error && (
                  <Alert variant="destructive">
                    <AlertCircleIcon />
                    <AlertTitle>{error}</AlertTitle>
                  </Alert>
                )}

                <Button
                  variant="ghost"
                  onClick={() => router.back()}
                  className="w-fit text-xs h-8"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to List
                </Button>

                <div className="flex flex-col lg:flex-row gap-4">
                  {/* Left Sidebar Tabs */}
                  <div className="lg:w-64 shrink-0">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold">Navigation</CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <Tabs defaultValue="plan" orientation="vertical" className="w-full">
                          <TabsList className="flex flex-col h-auto bg-transparent space-y-1 p-2">
                            <TabsTrigger value="plan" className="justify-start text-xs data-[state=active]:bg-slate-100">
                              Account Development Plan
                            </TabsTrigger>
                            {/* Add more tabs here as needed */}
                          </TabsList>
                        </Tabs>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Main Content */}
                  <div className="flex-1">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold">
                          {isNew ? "New Account Development Plan" : "Edit Account Development Plan"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-xs">Company Name</Label>
                            <Input placeholder="Enter company name" className="text-sm" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Contact Person</Label>
                            <Input placeholder="Enter contact person" className="text-sm" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Email</Label>
                            <Input type="email" placeholder="Enter email" className="text-sm" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Phone</Label>
                            <Input placeholder="Enter phone number" className="text-sm" />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Address</Label>
                          <Textarea placeholder="Enter address" className="text-sm" rows={3} />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Development Plan</Label>
                          <Textarea placeholder="Enter account development plan details" className="text-sm" rows={6} />
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                          <Button variant="outline" onClick={() => router.back()} className="text-xs h-9">
                            Cancel
                          </Button>
                          <Button className="text-xs h-9">
                            {isNew ? "Create" : "Update"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </>
            )}
          </main>
        </SidebarInset>
        <SidebarRight 
          dateCreatedFilterRange={dateCreatedFilterRange}
          setDateCreatedFilterRangeAction={setDateCreatedFilterRangeAction}
        />
      </ProtectedPageWrapper>
    </>
  );
}

export default function Page() {
  return (
    <UserProvider>
      <FormatProvider>
        <SidebarProvider>
          <Suspense fallback={<div>Loading...</div>}>
            <DetailContent />
          </Suspense>
        </SidebarProvider>
      </FormatProvider>
    </UserProvider>
  );
}
