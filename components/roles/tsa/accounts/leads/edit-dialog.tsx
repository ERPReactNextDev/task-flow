"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  PlusIcon, MinusIcon, CheckCircle2Icon,
  Loader2, XIcon, User, MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectTrigger, SelectContent, SelectItem,
} from "@/components/ui/select";
import { sileo } from "sileo";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Account {
  id: string;
  referenceid: string;
  company_name: string;
  contact_person: string;
  contact_number: string;
  email_address: string;
  address: string;
  delivery_address: string;
  region: string;
  type_client: string;
  industry: string;
  status?: string;
  company_group: string;
  tin_number?: string;
}

interface UserDetails {
  referenceid: string;
  tsm: string;
  manager: string;
}

interface LeadsEditDialogProps {
  account: Account | null;
  userDetails: UserDetails;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 2;
const STEPS = [
  { label: "Contact Information", description: "Person, number & email", icon: User },
  { label: "Address",             description: "Location & delivery info",  icon: MapPin },
];

const PLACEHOLDER_EMAIL_LOCALS = new Set([
  "none", "n/a", "na", "nil", "null", "noemail", "no_email", "noreply",
  "donotreply", "notavailable", "tbd", "tba", "placeholder", "test",
  "fake", "dummy", "sample", "unknown", "invalid",
]);

function isValidEmail(email: string): boolean {
  if (!email) return false;
  const trimmed = email.trim();
  const lower   = trimmed.toLowerCase();
  if (["none", "n/a", "na", "-", "—"].includes(lower)) return false;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(trimmed)) return false;
  const localPart = lower.split("@")[0];
  if (PLACEHOLDER_EMAIL_LOCALS.has(localPart)) return false;
  return true;
}

function formatPH(val: string): string {
  const digits = val.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 4) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
}

function formatLandline(digits: string): string {
  if (digits.length === 0) return "";
  const areaLen = digits.startsWith("2") ? 2 : 3;
  const area = digits.slice(0, areaLen);
  const rest = digits.slice(areaLen);
  if (rest.length === 0) return `(${area}`;
  if (rest.length <= 4) return `(${area}) ${rest}`;
  return `(${area}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
}

function formatIntl(cn: string): string {
  const digits = cn.replace(/\D/g, "");
  if (digits.length < 2) return cn;
  const cc = digits.slice(0, 2);
  const rest = digits.slice(2);
  if (!rest) return `+${cc}`;
  if (rest.length <= 3) return `+${cc} ${rest}`;
  if (rest.length <= 6) return `+${cc} ${rest.slice(0, 3)} ${rest.slice(3)}`;
  return `+${cc} ${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6)}`;
}

function splitField(val: string): string[] {
  if (!val) return [""];
  try {
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) return parsed.length ? parsed : [""];
  } catch {}
  const parts = val.split(",").map((s) => s.trim()).filter(Boolean);
  return parts.length ? parts : [""];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LeadsEditDialog({
  account,
  userDetails,
  open,
  onOpenChange,
  onSaved,
}: LeadsEditDialogProps) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [regions, setRegions] = useState<string[]>([]);

  const [contactPersons, setContactPersons] = useState<string[]>([""]);
  const [contactNumbers, setContactNumbers] = useState<string[]>([""]);
  const [emailAddresses, setEmailAddresses] = useState<string[]>([""]);
  const [address, setAddress]               = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [region, setRegion]                 = useState("");
  const [reason, setReason]                 = useState("");

  // Fetch regions
  useEffect(() => {
    fetch("https://psgc.gitlab.io/api/regions")
      .then((r) => r.json())
      .then((d) => setRegions(d.map((r: any) => r.name)))
      .catch(() => {});
  }, []);

  // Populate form when account changes
  useEffect(() => {
    if (!open || !account) return;
    setStep(0);
    setReason("");
    setContactPersons(splitField(account.contact_person));
    setContactNumbers(splitField(account.contact_number));
    setEmailAddresses(splitField(account.email_address));
    setAddress(account.address || "");
    setDeliveryAddress(account.delivery_address || "");
    setRegion(account.region || "");
  }, [open, account]);

  const canProceed = (): boolean => {
    if (step === 0) {
      return (
        contactPersons.every((v) => v.trim()) &&
        contactNumbers.every((v) => v.trim()) &&
        emailAddresses.every((v) => isValidEmail(v))
      );
    }
    return (
      address.trim() !== "" &&
      deliveryAddress.trim() !== "" &&
      region !== "" &&
      reason.trim() !== ""
    );
  };

  const handleSave = async () => {
    if (!account || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/com-edit-account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id:               account.id,
          referenceid:      account.referenceid,
          company_name:     account.company_name,
          contact_person:   contactPersons.filter(Boolean).join(", "),
          contact_number:   contactNumbers.filter(Boolean).join(", "),
          email_address:    emailAddresses.filter(Boolean).join(", "),
          address:          address.toUpperCase(),
          delivery_address: deliveryAddress.toUpperCase(),
          region,
          type_client:      account.type_client,
          industry:         account.industry,
          status:           "For Approval",  // promote from inactive to pending approval
          company_group:    account.company_group,
          tin_number:       account.tin_number,
          date_updated:     new Date().toISOString(),
          reason,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      sileo.success({
        title: "Saved",
        description: "Account updated successfully.",
        duration: 3000, position: "top-right", fill: "black",
        styles: { title: "text-white!", description: "text-white" },
      });
      onOpenChange(false);
      onSaved();
    } catch {
      sileo.error({
        title: "Failed",
        description: "Failed to update account.",
        duration: 3000, position: "top-right", fill: "black",
        styles: { title: "text-white!", description: "text-white" },
      });
    } finally {
      setSaving(false);
    }
  };

  if (!open || !account) return null;

  // ── Step content ────────────────────────────────────────────────────────────

  const renderStep = () => {
    if (step === 0) return (
      <div className="space-y-6">

        {/* Contact Persons */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Contact Person(s)</p>
          <div className="space-y-2">
            {contactPersons.map((val, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  value={val}
                  onChange={(e) => {
                    const c = [...contactPersons];
                    c[i] = e.target.value.toUpperCase().replace(/[^A-Z0-9 ]/g, "");
                    setContactPersons(c);
                  }}
                  placeholder="Full name"
                  className="rounded-none flex-1 uppercase"
                />
                <Button type="button" variant="destructive" size="icon" className="rounded-none shrink-0"
                  disabled={contactPersons.length === 1}
                  onClick={() => setContactPersons(contactPersons.filter((_, j) => j !== i))}>
                  <MinusIcon className="h-4 w-4" />
                </Button>
                <Button type="button" size="icon" className="rounded-none shrink-0"
                  onClick={() => setContactPersons([...contactPersons, ""])}>
                  <PlusIcon className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Numbers */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Contact Number(s)</p>
          <div className="space-y-2">
            {contactNumbers.map((cn, i) => {
              const isIntl     = cn.startsWith("+");
              const digits     = cn.replace(/\D/g, "");
              const isLandline = !isIntl && digits.startsWith("0") && !digits.startsWith("09") && digits.length >= 2;
              const isCustom   = cn.startsWith("#");
              const displayVal = isCustom ? cn.slice(1)
                : isIntl     ? formatIntl(cn)
                : isLandline ? formatLandline(digits)
                :               formatPH(digits);
              const type = isCustom ? "custom" : isIntl ? "intl" : isLandline ? "landline" : "local";

              return (
                <div key={i} className="flex gap-2">
                  <Select value={type} onValueChange={(v) => {
                    const c = [...contactNumbers];
                    if (v === "local")    c[i] = digits.startsWith("0") ? digits.slice(0, 11) : "09";
                    if (v === "intl")     c[i] = digits ? `+${digits}` : "+63";
                    if (v === "landline") c[i] = digits.startsWith("09") ? "02" : digits.slice(0, 10);
                    if (v === "custom")   c[i] = "#" + (cn.startsWith("#") ? cn.slice(1) : cn);
                    setContactNumbers(c);
                  }}>
                    <SelectTrigger className="w-[105px] rounded-none shrink-0 text-xs">
                      {type === "custom" ? "Custom" : type === "intl" ? "Intl" : type === "landline" ? "Landline" : "Phil"}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">Phil (Mobile)</SelectItem>
                      <SelectItem value="landline">Landline</SelectItem>
                      <SelectItem value="intl">International</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    value={displayVal}
                    onChange={(e) => {
                      const c = [...contactNumbers];
                      if (isCustom) c[i] = "#" + e.target.value;
                      else if (isIntl) c[i] = "+" + e.target.value.replace(/\D/g, "");
                      else c[i] = e.target.value.replace(/\D/g, "").slice(0, isLandline ? 10 : 11);
                      setContactNumbers(c);
                    }}
                    placeholder={isCustom ? "Any format" : isIntl ? "+63 917 123 4567" : isLandline ? "(02) 8123-4567" : "0900-000-0000"}
                    className="rounded-none flex-1"
                    inputMode={isCustom ? "text" : "numeric"}
                  />
                  <Button type="button" variant="destructive" size="icon" className="rounded-none shrink-0"
                    disabled={contactNumbers.length === 1}
                    onClick={() => setContactNumbers(contactNumbers.filter((_, j) => j !== i))}>
                    <MinusIcon className="h-4 w-4" />
                  </Button>
                  <Button type="button" size="icon" className="rounded-none shrink-0"
                    onClick={() => setContactNumbers([...contactNumbers, ""])}>
                    <PlusIcon className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Email Addresses */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Email Address(es)</p>
          <div className="space-y-2">
            {emailAddresses.map((em, i) => {
              const err = em && !isValidEmail(em) ? "Invalid email format" : "";
              return (
                <div key={i}>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      value={em}
                      onChange={(e) => {
                        const c = [...emailAddresses];
                        c[i] = e.target.value;
                        setEmailAddresses(c);
                      }}
                      placeholder="email@company.com"
                      className={`rounded-none flex-1 ${err ? "border-red-400" : ""}`}
                    />
                    <Button type="button" variant="destructive" size="icon" className="rounded-none shrink-0"
                      disabled={emailAddresses.length === 1}
                      onClick={() => setEmailAddresses(emailAddresses.filter((_, j) => j !== i))}>
                      <MinusIcon className="h-4 w-4" />
                    </Button>
                    <Button type="button" size="icon" className="rounded-none shrink-0"
                      onClick={() => setEmailAddresses([...emailAddresses, ""])}>
                      <PlusIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  {err && <p className="text-red-500 text-xs mt-1">{err}</p>}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    );

    // Step 1 — Address
    return (
      <div className="space-y-6">

        {/* Region */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Region</p>
          <Select value={region} onValueChange={setRegion}>
            <SelectTrigger className="w-full rounded-none">
              <span>{region || "Select Region"}</span>
            </SelectTrigger>
            <SelectContent>
              {regions.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Address */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Address</p>
          <Textarea
            value={address}
            onChange={(e) => setAddress(e.target.value.toUpperCase())}
            placeholder="COMPLETE BUSINESS ADDRESS"
            className="rounded-none uppercase"
            rows={3}
          />
        </div>

        {/* Delivery Address */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">Delivery Address</p>
          <Textarea
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value.toUpperCase())}
            placeholder="DELIVERY ADDRESS"
            className="rounded-none uppercase"
            rows={3}
          />
        </div>

        {/* Status notice */}
        <div className="flex items-center gap-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-sm">
          <div className="h-2 w-2 rounded-full bg-amber-400 shrink-0" />
          <span className="text-xs font-semibold text-amber-700">Status will be set to <strong>For Approval</strong></span>
          <span className="text-[10px] text-amber-500 ml-auto">Pending admin review</span>
        </div>

        {/* Reason */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
            Reason / Remarks <span className="text-red-500">*</span>
          </p>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Enter reason for updating this account..."
            className={`rounded-none ${reason.trim() === "" ? "border-red-300" : ""}`}
            rows={3}
          />
          {reason.trim() === "" && (
            <p className="text-red-500 text-xs mt-1">Reason is required.</p>
          )}
        </div>

      </div>
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white overflow-hidden">

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
        <div>
          <h1 className="text-base font-bold leading-tight">Edit Account</h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium uppercase tracking-wide">
            {account.company_name}
          </p>
        </div>
        <Button type="button" variant="ghost" size="icon" className="rounded-none"
          onClick={() => onOpenChange(false)}>
          <XIcon className="h-5 w-5" />
        </Button>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">

        {/* Stepper sidebar */}
        <div className="w-100 shrink-0 border-r bg-gray-50 flex flex-col py-6 px-4 gap-1">
          {STEPS.map((s, i) => {
            const isCompleted = i < step;
            const isCurrent   = i === step;
            const Icon = s.icon;
            return (
              <button key={i} type="button"
                onClick={() => { if (i < step) setStep(i); }}
                className={`w-full text-left flex items-start gap-3 px-3 py-3 rounded-md transition-all
                  ${isCurrent   ? "bg-white border border-gray-200 shadow-sm"
                  : isCompleted ? "hover:bg-white/70 cursor-pointer"
                  :               "opacity-40 cursor-not-allowed"}`}
              >
                <div className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mt-0.5
                  ${isCompleted || isCurrent ? "bg-black text-white" : "bg-gray-200 text-gray-500"}`}>
                  {isCompleted ? <CheckCircle2Icon className="h-4 w-4" /> : <Icon className="h-3.5 w-3.5" />}
                </div>
                <div>
                  <p className={`text-xs font-semibold leading-tight ${isCurrent ? "text-black" : isCompleted ? "text-gray-700" : "text-gray-400"}`}>
                    {s.label}
                  </p>
                  <p className={`text-[10px] mt-0.5 leading-tight ${isCurrent ? "text-gray-500" : "text-gray-400"}`}>
                    {s.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Form area */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full px-8 py-8">
            <div className="mb-6">
              <h2 className="text-sm font-bold text-gray-900">{STEPS[step].label}</h2>
              <div className="h-0.5 w-8 bg-black mt-1.5" />
            </div>
            {renderStep()}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t px-6 py-4 bg-white">
        <div className="mx-auto w-full max-w-xl flex gap-3">
          <Button variant="outline" type="button" className="rounded-none flex-1 py-5 font-semibold text-sm"
            onClick={() => step === 0 ? onOpenChange(false) : setStep(0)}
            disabled={saving}>
            {step === 0 ? "Cancel" : "Back"}
          </Button>
          {step === 0 ? (
            <Button type="button" disabled={!canProceed()}
              className="rounded-none flex-1 py-5 font-semibold text-sm"
              onClick={() => setStep(1)}>
              Next
            </Button>
          ) : (
            <Button type="button" disabled={!canProceed() || saving}
              className="rounded-none flex-1 py-5 font-semibold text-sm"
              onClick={handleSave}>
              {saving
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</>
                : <><CheckCircle2Icon className="h-4 w-4 mr-2" /> Save Changes</>
              }
            </Button>
          )}
        </div>
      </div>

    </div>
  );
}
