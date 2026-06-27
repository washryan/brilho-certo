"use client";

import Image from "next/image";
import {
  Ban,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Home,
  KeyRound,
  Lock,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
  WalletCards,
} from "lucide-react";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

type BookingStatus =
  | "pre-reservado"
  | "confirmado"
  | "cancelado"
  | "indisponivel";

type Booking = {
  id: string;
  name: string;
  phone: string;
  neighborhood: string;
  address: string;
  propertyType: string;
  rooms: string;
  date: string;
  time: string;
  notes?: string;
  pets?: boolean;
  products?: boolean;
  extras: string[];
  status: BookingStatus;
  createdAt: string;
};

type DayState = "livre" | "ocupado" | "indisponivel" | "passado";

const bookingSchema = z.object({
  name: z.string().min(3, "Informe seu nome completo."),
  phone: z.string().min(14, "Informe um WhatsApp válido."),
  neighborhood: z.string().min(2, "Informe o bairro."),
  address: z.string().min(5, "Informe o endereço."),
  propertyType: z.string().min(1, "Selecione o tipo de imóvel."),
  rooms: z.string().min(1, "Informe a quantidade de cômodos."),
  date: z.string().min(1, "Escolha uma data."),
  time: z.string().min(1, "Escolha um horário."),
  notes: z.string().optional(),
  pets: z.boolean().optional(),
  products: z.boolean().optional(),
  extras: z.array(z.string()).optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

const STORAGE = {
  bookings: "brilho-certo-bookings",
  blockedDates: "brilho-certo-blocked-dates",
  whatsapp: "brilho-certo-whatsapp",
};

const BASE_PRICE = 150;
const DEFAULT_WHATSAPP = "5587988690660";
const ADMIN_PASSWORD = "brilho150";
const timeOptions = ["08:00", "09:00", "13:00"];
const extraOptions = [
  "Limpeza interna de geladeira",
  "Limpeza interna de armários",
  "Organização simples",
  "Limpeza pesada",
  "Limpeza pré ou pós mudança",
];

const serviceIncludes = [
  "Limpeza geral de cômodos",
  "Banheiro e cozinha",
  "Retirada de poeira",
  "Organização básica",
  "Cuidado com os ambientes",
];

const testimonials = [
  {
    name: "Marina Souza",
    text: "A casa ficou impecável e o agendamento foi muito simples. Recebi confirmação rapidinho pelo WhatsApp.",
  },
  {
    name: "Rafael Lima",
    text: "Serviço pontual, cuidadoso e transparente. Gostei de saber o valor e o horário antes de confirmar.",
  },
  {
    name: "Beatriz Rocha",
    text: "Atendimento muito humano. Tenho pets e tudo foi combinado com calma antes da faxina.",
  },
];

const differentials = [
  ["Atendimento humanizado", ShieldCheck],
  ["Agendamento fácil", CalendarDays],
  ["Confirmação rápida", MessageCircle],
  ["Valor transparente", WalletCards],
  ["Cuidado com o ambiente", Home],
  ["Praticidade no contato", Phone],
] as const;

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatBrazilianDate(key: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parseDateKey(key));
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function onlyNumbers(value: string) {
  return value.replace(/\D/g, "");
}

function formatPhone(value: string) {
  const digits = onlyNumbers(value).slice(0, 11);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function buildWhatsAppLink(values: BookingFormValues, whatsappNumber: string) {
  const message = [
    "Olá! Gostaria de agendar uma faxina com a Brilho Certo.",
    "",
    `Nome: ${values.name}`,
    `Data: ${formatBrazilianDate(values.date)}`,
    `Horário: ${values.time}`,
    `Bairro: ${values.neighborhood}`,
    `Endereço: ${values.address}`,
    `Tipo de imóvel: ${values.propertyType}`,
    `Cômodos: ${values.rooms}`,
    `Valor base da diária: R$${BASE_PRICE}`,
    `Possui pets: ${values.pets ? "Sim" : "Não"}`,
    `Precisa levar produtos: ${values.products ? "Sim" : "Não"}`,
    `Adicionais: ${values.extras?.length ? values.extras.join(", ") : "Nenhum"}`,
    `Observações: ${values.notes?.trim() || "Sem observações"}`,
    "",
    "Aguardo confirmação. Obrigado(a)!",
  ].join("\n");

  return `https://wa.me/${onlyNumbers(whatsappNumber)}?text=${encodeURIComponent(message)}`;
}

function createSeedBookings(today: Date): Booking[] {
  return [
    {
      id: "seed-1",
      name: "Cliente reservado",
      phone: "(11) 99999-0001",
      neighborhood: "Centro",
      address: "Endereço confirmado via WhatsApp",
      propertyType: "Apartamento",
      rooms: "4",
      date: formatDateKey(addDays(today, 3)),
      time: "09:00",
      notes: "Reserva demonstrativa.",
      pets: false,
      products: true,
      extras: ["Organização simples"],
      status: "confirmado",
      createdAt: new Date().toISOString(),
    },
    {
      id: "seed-2",
      name: "Cliente em confirmação",
      phone: "(11) 99999-0002",
      neighborhood: "Jardim das Flores",
      address: "Endereço pendente",
      propertyType: "Casa",
      rooms: "5",
      date: formatDateKey(addDays(today, 7)),
      time: "08:00",
      notes: "Pré-reserva demonstrativa.",
      pets: true,
      products: false,
      extras: [],
      status: "pre-reservado",
      createdAt: new Date().toISOString(),
    },
  ];
}

function getInitialBlockedDates(today: Date) {
  return [formatDateKey(addDays(today, 5)), formatDateKey(addDays(today, 12))];
}

const fallbackToday = new Date();
const fallbackBookings = createSeedBookings(fallbackToday);
const fallbackBlockedDates = getInitialBlockedDates(fallbackToday);
const storeCache = new Map<string, { raw: string; value: unknown }>();
const storeEventName = "brilho-certo-store-change";

function subscribeStoredValue(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener("storage", onStoreChange);
  window.addEventListener(storeEventName, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(storeEventName, onStoreChange);
  };
}

function getStoredValue<T>(key: string, fallback: T) {
  if (typeof window === "undefined") {
    return fallback;
  }

  const raw = window.localStorage.getItem(key);

  if (!raw) {
    return fallback;
  }

  const cached = storeCache.get(key);
  if (cached?.raw === raw) {
    return cached.value as T;
  }

  try {
    const value = JSON.parse(raw) as T;
    storeCache.set(key, { raw, value });
    return value;
  } catch {
    return fallback;
  }
}

function setStoredValue<T>(key: string, value: T) {
  if (typeof window === "undefined") {
    return;
  }

  const raw = JSON.stringify(value);
  storeCache.set(key, { raw, value });
  window.localStorage.setItem(key, raw);
  window.dispatchEvent(new Event(storeEventName));
}

function useStoredValue<T>(key: string, fallback: T) {
  return useSyncExternalStore(
    subscribeStoredValue,
    () => getStoredValue(key, fallback),
    () => fallback,
  );
}

function statusLabel(status: BookingStatus) {
  const labels: Record<BookingStatus, string> = {
    "pre-reservado": "Pré-reservado",
    confirmado: "Confirmado",
    cancelado: "Cancelado",
    indisponivel: "Indisponível",
  };

  return labels[status];
}

function fieldClass(hasError?: boolean) {
  return [
    "min-h-11 w-full rounded-lg border bg-white px-3 text-sm text-[#3E4A4A] shadow-sm transition",
    "placeholder:text-[#778383] focus:border-[#2F5D62] focus:outline-none focus:ring-4 focus:ring-[#7FC8A9]/25",
    hasError ? "border-[#b45f5f]" : "border-[#D8E2DD]",
  ].join(" ");
}

function textAreaClass(hasError?: boolean) {
  return [
    "min-h-24 w-full resize-none rounded-lg border bg-white px-3 py-3 text-sm text-[#3E4A4A] shadow-sm transition",
    "placeholder:text-[#778383] focus:border-[#2F5D62] focus:outline-none focus:ring-4 focus:ring-[#7FC8A9]/25",
    hasError ? "border-[#b45f5f]" : "border-[#D8E2DD]",
  ].join(" ");
}

function ErrorMessage({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-1 text-xs font-medium text-[#9A3F3F]">{message}</p>;
}

function BrandMark() {
  return (
    <a href="#inicio" className="flex items-center" aria-label="Brilho Certo">
      <Image
        src="/brand/brilho-certo-horizontal-crop.png"
        alt="Brilho Certo Limpeza Residencial"
        width={312}
        height={118}
        priority
        className="h-12 w-auto object-contain sm:h-14"
      />
    </a>
  );
}

function PrimaryButton({
  children,
  href,
  type = "button",
  onClick,
  disabled,
  className = "",
}: {
  children: React.ReactNode;
  href?: string;
  type?: "button" | "submit";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const classes = `inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#2F5D62] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#2F5D62]/20 transition hover:bg-[#24494D] disabled:cursor-not-allowed disabled:opacity-55 ${className}`;

  if (href) {
    return (
      <a className={classes} href={href}>
        {children}
      </a>
    );
  }

  return (
    <button className={classes} type={type} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

function SecondaryButton({
  children,
  href,
  onClick,
  type = "button",
  className = "",
}: {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
}) {
  const classes = `inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#CBDAD5] bg-white px-5 py-3 text-sm font-bold text-[#2F5D62] shadow-sm transition hover:border-[#7FC8A9] hover:bg-[#F8FBFA] ${className}`;

  if (href) {
    return (
      <a className={classes} href={href}>
        {children}
      </a>
    );
  }

  return (
    <button className={classes} type={type} onClick={onClick}>
      {children}
    </button>
  );
}

function SectionHeader({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-sm font-bold uppercase text-[#2F5D62]">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-bold text-[#263B3C] sm:text-4xl">{title}</h2>
      <p className="mt-4 text-base leading-7 text-[#60706F]">{text}</p>
    </div>
  );
}

function Calendar({
  monthDate,
  bookings,
  blockedDates,
  selectedDate,
  onSelectDate,
  onMonthChange,
}: {
  monthDate: Date;
  bookings: Booking[];
  blockedDates: string[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onMonthChange: (date: Date) => void;
}) {
  const today = startOfDay(new Date());
  const daysInMonth = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth() + 1,
    0,
  ).getDate();
  const firstWeekday = new Date(
    monthDate.getFullYear(),
    monthDate.getMonth(),
    1,
  ).getDay();
  const monthLabel = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(monthDate);

  const occupiedDates = new Set(
    bookings
      .filter((booking) => booking.status !== "cancelado")
      .map((booking) => booking.date),
  );

  const getDayState = (date: Date): DayState => {
    const key = formatDateKey(date);

    if (startOfDay(date) < today) {
      return "passado";
    }

    if (blockedDates.includes(key)) {
      return "indisponivel";
    }

    if (occupiedDates.has(key)) {
      return "ocupado";
    }

    return "livre";
  };

  const stateClasses: Record<DayState, string> = {
    livre: "border-[#7FC8A9] bg-[#E7F6F0] text-[#234F4A] hover:bg-[#CDEDE0]",
    ocupado: "cursor-not-allowed border-[#D6D0C9] bg-[#EEE9E2] text-[#8D8175]",
    indisponivel: "cursor-not-allowed border-[#E7B9B9] bg-[#F7E8E8] text-[#A05252]",
    passado: "cursor-not-allowed border-[#E4E9E7] bg-[#F4F6F5] text-[#A3ADAA]",
  };

  return (
    <div className="rounded-lg border border-[#D8E2DD] bg-white p-4 shadow-xl shadow-[#2F5D62]/8">
      <div className="mb-4 flex items-center justify-between gap-3">
        <button
          className="grid h-10 w-10 place-items-center rounded-lg border border-[#D8E2DD] text-[#2F5D62] transition hover:bg-[#F8FBFA]"
          type="button"
          onClick={() =>
            onMonthChange(
              new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1),
            )
          }
          aria-label="Mês anterior"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>
        <h3 className="text-center text-lg font-bold capitalize text-[#263B3C]">
          {monthLabel}
        </h3>
        <button
          className="grid h-10 w-10 place-items-center rounded-lg border border-[#D8E2DD] text-[#2F5D62] transition hover:bg-[#F8FBFA]"
          type="button"
          onClick={() =>
            onMonthChange(
              new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1),
            )
          }
          aria-label="Próximo mês"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold uppercase text-[#778383]">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-2">
        {Array.from({ length: firstWeekday }).map((_, index) => (
          <span key={`blank-${index}`} className="aspect-square" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1;
          const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
          const key = formatDateKey(date);
          const state = getDayState(date);
          const isAvailable = state === "livre";
          const isSelected = selectedDate === key;

          return (
            <button
              key={key}
              className={`aspect-square rounded-lg border text-sm font-bold transition ${stateClasses[state]} ${
                isSelected ? "ring-4 ring-[#D9B86C]/45" : ""
              }`}
              type="button"
              disabled={!isAvailable}
              onClick={() => onSelectDate(key)}
              aria-label={`${day} de ${monthLabel}, ${state}`}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs font-medium text-[#60706F] sm:grid-cols-4">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-[#7FC8A9]" /> Livre
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-[#D6D0C9]" /> Ocupado
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-[#E7B9B9]" /> Indisponível
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-sm bg-[#E4E9E7]" /> Passado
        </span>
      </div>
    </div>
  );
}

function BookingForm({
  selectedDate,
  whatsappNumber,
  onBookingCreated,
}: {
  selectedDate: string;
  whatsappNumber: string;
  onBookingCreated: (booking: Booking) => void;
}) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      date: selectedDate,
      time: "08:00",
      extras: [],
      pets: false,
      products: false,
    },
  });

  useEffect(() => {
    setValue("date", selectedDate, { shouldValidate: true });
  }, [selectedDate, setValue]);

  const phoneRegister = register("phone");

  const onSubmit = (values: BookingFormValues) => {
    const booking: Booking = {
      id: crypto.randomUUID(),
      name: values.name,
      phone: values.phone,
      neighborhood: values.neighborhood,
      address: values.address,
      propertyType: values.propertyType,
      rooms: values.rooms,
      date: values.date,
      time: values.time,
      notes: values.notes,
      pets: values.pets,
      products: values.products,
      extras: values.extras ?? [],
      status: "pre-reservado",
      createdAt: new Date().toISOString(),
    };

    onBookingCreated(booking);
    window.open(buildWhatsAppLink(values, whatsappNumber), "_blank", "noopener,noreferrer");
    reset({
      date: selectedDate,
      time: "08:00",
      extras: [],
      pets: false,
      products: false,
    });
  };

  return (
    <form
      className="rounded-lg border border-[#D8E2DD] bg-[#F8FBFA] p-4 shadow-xl shadow-[#2F5D62]/8 sm:p-5"
      onSubmit={handleSubmit(onSubmit)}
    >
      <div className="mb-5 flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-[#2F5D62] text-white">
          <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-xl font-bold text-[#263B3C]">Solicitação de agendamento</h3>
          <p className="mt-1 text-sm text-[#60706F]">
            {selectedDate
              ? `${formatBrazilianDate(selectedDate)} | diária base R$${BASE_PRICE}`
              : "Selecione um dia livre na agenda"}
          </p>
        </div>
      </div>

      <input type="hidden" {...register("date")} />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="mb-1 block text-sm font-bold text-[#3E4A4A]">Nome</span>
          <input
            className={fieldClass(Boolean(errors.name))}
            placeholder="Seu nome completo"
            {...register("name")}
          />
          <ErrorMessage message={errors.name?.message} />
        </label>

        <label>
          <span className="mb-1 block text-sm font-bold text-[#3E4A4A]">
            Telefone/WhatsApp
          </span>
          <input
            className={fieldClass(Boolean(errors.phone))}
            placeholder="(11) 99999-9999"
            inputMode="tel"
            {...phoneRegister}
            onChange={(event) => {
              event.target.value = formatPhone(event.target.value);
              phoneRegister.onChange(event);
            }}
          />
          <ErrorMessage message={errors.phone?.message} />
        </label>

        <label>
          <span className="mb-1 block text-sm font-bold text-[#3E4A4A]">Bairro</span>
          <input
            className={fieldClass(Boolean(errors.neighborhood))}
            placeholder="Ex.: Vila Mariana"
            {...register("neighborhood")}
          />
          <ErrorMessage message={errors.neighborhood?.message} />
        </label>

        <label className="sm:col-span-2">
          <span className="mb-1 block text-sm font-bold text-[#3E4A4A]">Endereço</span>
          <input
            className={fieldClass(Boolean(errors.address))}
            placeholder="Rua, número e complemento"
            {...register("address")}
          />
          <ErrorMessage message={errors.address?.message} />
        </label>

        <label>
          <span className="mb-1 block text-sm font-bold text-[#3E4A4A]">
            Tipo de imóvel
          </span>
          <select className={fieldClass(Boolean(errors.propertyType))} {...register("propertyType")}>
            <option value="">Selecione</option>
            <option>Apartamento</option>
            <option>Casa</option>
            <option>Studio</option>
            <option>Sobrado</option>
          </select>
          <ErrorMessage message={errors.propertyType?.message} />
        </label>

        <label>
          <span className="mb-1 block text-sm font-bold text-[#3E4A4A]">
            Cômodos aproximados
          </span>
          <input
            className={fieldClass(Boolean(errors.rooms))}
            placeholder="Ex.: 4"
            inputMode="numeric"
            {...register("rooms")}
          />
          <ErrorMessage message={errors.rooms?.message} />
        </label>

        <label className="sm:col-span-2">
          <span className="mb-1 block text-sm font-bold text-[#3E4A4A]">
            Horário de início
          </span>
          <div className="grid grid-cols-3 gap-2">
            {timeOptions.map((time) => (
              <label
                key={time}
                className="flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-[#CBDAD5] bg-white px-2 text-sm font-bold text-[#2F5D62] has-[:checked]:border-[#2F5D62] has-[:checked]:bg-[#E7F6F0]"
              >
                <input
                  className="sr-only"
                  type="radio"
                  value={time}
                  {...register("time")}
                />
                {time}
              </label>
            ))}
          </div>
          <ErrorMessage message={errors.time?.message} />
        </label>

        <div className="sm:col-span-2">
          <span className="mb-2 block text-sm font-bold text-[#3E4A4A]">
            Adicionais opcionais
          </span>
          <div className="grid gap-2 sm:grid-cols-2">
            {extraOptions.map((extra) => (
              <label
                key={extra}
                className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-[#CBDAD5] bg-white px-3 text-sm font-medium text-[#3E4A4A] has-[:checked]:border-[#7FC8A9] has-[:checked]:bg-[#E7F6F0]"
              >
                <input
                  className="h-4 w-4 accent-[#2F5D62]"
                  type="checkbox"
                  value={extra}
                  {...register("extras")}
                />
                {extra}
              </label>
            ))}
          </div>
        </div>

        <label className="flex min-h-11 items-center gap-2 rounded-lg border border-[#CBDAD5] bg-white px-3 text-sm font-medium text-[#3E4A4A]">
          <input className="h-4 w-4 accent-[#2F5D62]" type="checkbox" {...register("pets")} />
          Possui pets?
        </label>

        <label className="flex min-h-11 items-center gap-2 rounded-lg border border-[#CBDAD5] bg-white px-3 text-sm font-medium text-[#3E4A4A]">
          <input
            className="h-4 w-4 accent-[#2F5D62]"
            type="checkbox"
            {...register("products")}
          />
          Precisa levar produtos?
        </label>

        <label className="sm:col-span-2">
          <span className="mb-1 block text-sm font-bold text-[#3E4A4A]">Observações</span>
          <textarea
            className={textAreaClass(Boolean(errors.notes))}
            placeholder="Preferências, acesso ao prédio, detalhes do imóvel..."
            {...register("notes")}
          />
        </label>
      </div>

      <PrimaryButton
        className="mt-5 w-full"
        disabled={!selectedDate || isSubmitting}
        type="submit"
      >
        <MessageCircle className="h-4 w-4" aria-hidden="true" />
        Solicitar pelo WhatsApp
      </PrimaryButton>
    </form>
  );
}

function AdminPanel({
  bookings,
  blockedDates,
  whatsappNumber,
  onWhatsappChange,
  onStatusChange,
  onToggleBlockedDate,
}: {
  bookings: Booking[];
  blockedDates: string[];
  whatsappNumber: string;
  onWhatsappChange: (value: string) => void;
  onStatusChange: (id: string, status: BookingStatus) => void;
  onToggleBlockedDate: (date: string) => void;
}) {
  const [isLogged, setIsLogged] = useState(false);
  const [password, setPassword] = useState("");
  const [adminDate, setAdminDate] = useState(formatDateKey(new Date()));

  const activeBookings = bookings.filter((booking) => booking.status !== "cancelado");
  const confirmedBookings = bookings.filter((booking) => booking.status === "confirmado");
  const revenue = confirmedBookings.length * BASE_PRICE;

  const sortedBookings = [...bookings].sort((first, second) =>
    first.date.localeCompare(second.date),
  );

  if (!isLogged) {
    return (
      <section id="admin" className="bg-[#2F5D62] px-4 py-16 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase text-[#D9B86C]">Painel administrativo</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Controle simples para a rotina da Brilho Certo
            </h2>
            <p className="mt-4 max-w-2xl leading-7 text-white/78">
              A dona do serviço pode consultar reservas, bloquear dias, liberar agenda e
              acompanhar confirmações em uma área reservada.
            </p>
          </div>

          <form
            className="rounded-lg border border-white/15 bg-white p-5 text-[#3E4A4A] shadow-2xl shadow-black/15"
            onSubmit={(event) => {
              event.preventDefault();
              setIsLogged(password === ADMIN_PASSWORD);
            }}
          >
            <div className="mb-4 flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#E7F6F0] text-[#2F5D62]">
                <Lock className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-xl font-bold text-[#263B3C]">Acesso da profissional</h3>
                <p className="text-sm text-[#60706F]">Senha MVP: brilho150</p>
              </div>
            </div>
            <label>
              <span className="mb-1 block text-sm font-bold text-[#3E4A4A]">Senha</span>
              <input
                className={fieldClass()}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Digite a senha"
              />
            </label>
            <PrimaryButton className="mt-4 w-full" type="submit">
              <KeyRound className="h-4 w-4" aria-hidden="true" />
              Entrar no painel
            </PrimaryButton>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section id="admin" className="bg-[#2F5D62] px-4 py-16 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase text-[#D9B86C]">Painel administrativo</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">Agenda e reservas</h2>
          </div>
          <SecondaryButton className="border-white/25 bg-white/10 text-white hover:bg-white/15" onClick={() => setIsLogged(false)}>
            Sair
          </SecondaryButton>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Reservas ativas", activeBookings.length],
            ["Confirmadas", confirmedBookings.length],
            ["Dias bloqueados", blockedDates.length],
            ["Receita base", `R$${revenue}`],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-white/15 bg-white/10 p-4">
              <p className="text-sm text-white/72">{label}</p>
              <p className="mt-2 text-2xl font-bold text-white">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
          <div className="rounded-lg border border-white/15 bg-white p-5 text-[#3E4A4A]">
            <h3 className="text-xl font-bold text-[#263B3C]">Configuração</h3>
            <label className="mt-4 block">
              <span className="mb-1 block text-sm font-bold text-[#3E4A4A]">
                WhatsApp da Brilho Certo
              </span>
              <input
                className={fieldClass()}
                value={whatsappNumber}
                onChange={(event) => onWhatsappChange(event.target.value)}
              />
            </label>

            <div className="mt-5 rounded-lg border border-[#D8E2DD] bg-[#F8FBFA] p-4">
              <h4 className="font-bold text-[#263B3C]">Bloqueio de dias</h4>
              <label className="mt-3 block">
                <span className="mb-1 block text-sm font-bold text-[#3E4A4A]">Data</span>
                <input
                  className={fieldClass()}
                  type="date"
                  value={adminDate}
                  onChange={(event) => setAdminDate(event.target.value)}
                />
              </label>
              <SecondaryButton className="mt-3 w-full" onClick={() => onToggleBlockedDate(adminDate)}>
                {blockedDates.includes(adminDate) ? (
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Ban className="h-4 w-4" aria-hidden="true" />
                )}
                {blockedDates.includes(adminDate) ? "Liberar dia" : "Bloquear dia"}
              </SecondaryButton>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-white/15 bg-white text-[#3E4A4A]">
            <div className="border-b border-[#D8E2DD] p-5">
              <h3 className="text-xl font-bold text-[#263B3C]">Agendamentos</h3>
            </div>
            <div className="divide-y divide-[#E3EAE7]">
              {sortedBookings.length === 0 ? (
                <p className="p-5 text-sm text-[#60706F]">Nenhum agendamento registrado.</p>
              ) : (
                sortedBookings.map((booking) => (
                  <div key={booking.id} className="grid gap-4 p-5 lg:grid-cols-[1fr_auto]">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-[#E7F6F0] px-2.5 py-1 text-xs font-bold text-[#2F5D62]">
                          {statusLabel(booking.status)}
                        </span>
                        <span className="text-sm font-bold text-[#263B3C]">
                          {formatBrazilianDate(booking.date)} às {booking.time}
                        </span>
                      </div>
                      <h4 className="mt-3 text-lg font-bold text-[#263B3C]">{booking.name}</h4>
                      <p className="mt-1 text-sm text-[#60706F]">
                        {booking.neighborhood} | {booking.propertyType} | {booking.rooms} cômodos
                      </p>
                      <p className="mt-1 text-sm text-[#60706F]">{booking.address}</p>
                      {booking.notes ? (
                        <p className="mt-2 text-sm text-[#60706F]">{booking.notes}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap items-start gap-2 lg:justify-end">
                      <SecondaryButton
                        className="px-3"
                        href={`https://wa.me/55${onlyNumbers(booking.phone)}`}
                      >
                        <MessageCircle className="h-4 w-4" aria-hidden="true" />
                        WhatsApp
                      </SecondaryButton>
                      <button
                        className="min-h-10 rounded-lg bg-[#E7F6F0] px-3 text-sm font-bold text-[#2F5D62] transition hover:bg-[#CDEDE0]"
                        type="button"
                        onClick={() => onStatusChange(booking.id, "confirmado")}
                      >
                        Confirmar
                      </button>
                      <button
                        className="min-h-10 rounded-lg bg-[#F7E8E8] px-3 text-sm font-bold text-[#9A3F3F] transition hover:bg-[#F0D4D4]"
                        type="button"
                        onClick={() => onStatusChange(booking.id, "cancelado")}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function BrilhoCertoApp() {
  const bookings = useStoredValue<Booking[]>(STORAGE.bookings, fallbackBookings);
  const blockedDates = useStoredValue<string[]>(
    STORAGE.blockedDates,
    fallbackBlockedDates,
  );
  const whatsappNumber = useStoredValue(STORAGE.whatsapp, DEFAULT_WHATSAPP);
  const [selectedDate, setSelectedDate] = useState("");
  const [monthDate, setMonthDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const setBookings = (updater: Booking[] | ((current: Booking[]) => Booking[])) => {
    setStoredValue(
      STORAGE.bookings,
      typeof updater === "function" ? updater(bookings) : updater,
    );
  };

  const setBlockedDates = (
    updater: string[] | ((current: string[]) => string[]),
  ) => {
    setStoredValue(
      STORAGE.blockedDates,
      typeof updater === "function" ? updater(blockedDates) : updater,
    );
  };

  const setWhatsappNumber = (value: string) => {
    setStoredValue(STORAGE.whatsapp, value);
  };

  const quickWhatsApp = useMemo(() => {
    const message = encodeURIComponent(
      "Olá! Gostaria de falar com a Brilho Certo sobre uma faxina residencial.",
    );
    return `https://wa.me/${onlyNumbers(whatsappNumber)}?text=${message}`;
  }, [whatsappNumber]);

  const handleBookingCreated = (booking: Booking) => {
    setBookings((current) => [
      ...current.filter(
        (item) => item.date !== booking.date || item.status === "cancelado",
      ),
      booking,
    ]);
  };

  const handleStatusChange = (id: string, status: BookingStatus) => {
    setBookings((current) =>
      current.map((booking) => (booking.id === id ? { ...booking, status } : booking)),
    );
  };

  const handleToggleBlockedDate = (date: string) => {
    setBlockedDates((current) =>
      current.includes(date)
        ? current.filter((blockedDate) => blockedDate !== date)
        : [...current, date],
    );
  };

  return (
    <main id="inicio" className="min-h-screen bg-[#F8FBFA] text-[#3E4A4A]">
      <header className="sticky top-0 z-30 border-b border-[#D8E2DD]/80 bg-[#F8FBFA]/92 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <BrandMark />
          <nav className="hidden items-center gap-6 text-sm font-bold text-[#3E4A4A] md:flex">
            <a href="#como-funciona" className="hover:text-[#2F5D62]">
              Como funciona
            </a>
            <a href="#servicos" className="hover:text-[#2F5D62]">
              Serviços
            </a>
            <a href="#agenda" className="hover:text-[#2F5D62]">
              Agenda
            </a>
            <a href="#admin" className="hover:text-[#2F5D62]">
              Admin
            </a>
          </nav>
          <a
            className="grid h-11 w-11 place-items-center rounded-lg bg-[#25D366] text-white shadow-lg shadow-[#25D366]/20 md:hidden"
            href={quickWhatsApp}
            aria-label="Falar no WhatsApp"
          >
            <MessageCircle className="h-5 w-5" aria-hidden="true" />
          </a>
          <PrimaryButton href={quickWhatsApp} className="hidden md:inline-flex">
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            WhatsApp
          </PrimaryButton>
        </div>
      </header>

      <section className="px-4 pb-12 pt-10 sm:px-6 lg:px-8 lg:pb-16 lg:pt-16">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-lg border border-[#D9B86C]/45 bg-white px-3 py-2 text-sm font-bold text-[#6F5A23] shadow-sm">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Faxina diária a partir de R$150
            </div>
            <h1 className="mt-6 max-w-3xl text-4xl font-bold leading-[1.08] text-[#263B3C] sm:text-5xl lg:text-6xl">
              Agende sua faxina com praticidade e confiança
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#60706F]">
              Escolha um dia disponível, envie os detalhes e fale direto no WhatsApp
              com a Brilho Certo.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <PrimaryButton href="#agenda">
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                Agendar agora
              </PrimaryButton>
              <SecondaryButton href={quickWhatsApp}>
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                Falar no WhatsApp
              </SecondaryButton>
            </div>

            <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
              {[
                ["1 faxina por dia", Clock],
                ["Confirmação rápida", CheckCircle2],
                ["Contato humano", UserRound],
              ].map(([label, Icon]) => (
                <div
                  key={label as string}
                  className="flex items-center gap-3 rounded-lg border border-[#D8E2DD] bg-white px-3 py-3 shadow-sm"
                >
                  <Icon className="h-5 w-5 text-[#2F5D62]" aria-hidden="true" />
                  <span className="text-sm font-bold text-[#3E4A4A]">{label as string}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[460px] overflow-hidden rounded-lg border border-[#D8E2DD] bg-white shadow-2xl shadow-[#2F5D62]/12">
            <Image
              src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80"
              alt="Profissional de limpeza residencial organizando um ambiente claro"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 520px"
              className="object-cover object-[center_40%]"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/92 via-white/18 to-[#1F4144]/35" />
            <div className="absolute left-4 right-4 top-4 rounded-lg bg-white/94 p-4 shadow-xl backdrop-blur sm:left-6 sm:right-6">
              <Image
                src="/brand/brilho-certo-principal-crop.png"
                alt="Brilho Certo Limpeza Residencial"
                width={420}
                height={420}
                className="mx-auto h-32 w-auto object-contain sm:h-40"
              />
            </div>
            <div className="absolute inset-x-4 bottom-4 rounded-lg bg-white/94 p-4 shadow-xl backdrop-blur sm:inset-x-6">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#E7F6F0] text-[#2F5D62]">
                  <Image
                    src="/brand/brilho-certo-icone-crop.png"
                    alt=""
                    width={44}
                    height={44}
                    className="h-9 w-9 object-contain"
                  />
                </span>
                <div>
                  <p className="font-bold text-[#263B3C]">Residências mais leves no dia a dia</p>
                  <p className="text-sm text-[#60706F]">
                    Organização, capricho e atendimento pontual.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <SectionHeader
            eyebrow="Como funciona"
            title="Um fluxo simples, do calendário à confirmação"
            text="A cliente escolhe uma data livre, preenche os dados essenciais e segue para o WhatsApp com uma mensagem pronta."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-4">
            {[
              ["1", "Escolha o dia disponível", CalendarDays],
              ["2", "Informe seus dados e detalhes do local", ClipboardCheck],
              ["3", "Confirme pelo WhatsApp", MessageCircle],
              ["4", "Receba o atendimento no dia agendado", CheckCircle2],
            ].map(([step, title, Icon]) => (
              <div key={title as string} className="rounded-lg border border-[#D8E2DD] bg-[#F8FBFA] p-5">
                <div className="flex items-center justify-between gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-[#2F5D62] text-sm font-bold text-white">
                    {step as string}
                  </span>
                  <Icon className="h-5 w-5 text-[#D9B86C]" aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-[#263B3C]">{title as string}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="servicos" className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-sm font-bold uppercase text-[#2F5D62]">Serviços</p>
            <h2 className="mt-3 text-3xl font-bold text-[#263B3C] sm:text-4xl">
              Faxina diária residencial
            </h2>
            <p className="mt-4 text-base leading-7 text-[#60706F]">
              Limpeza geral de cômodos, banheiro, cozinha, retirada de poeira,
              organização básica e cuidado com os ambientes.
            </p>
          </div>
          <div className="rounded-lg border border-[#D8E2DD] bg-white p-5 shadow-xl shadow-[#2F5D62]/8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-[#60706F]">Valor base</p>
                <p className="mt-1 text-4xl font-bold text-[#2F5D62]">R$150</p>
              </div>
              <PrimaryButton href="#agenda">
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                Ver agenda
              </PrimaryButton>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {serviceIncludes.map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-lg bg-[#F8FBFA] p-3 text-sm font-bold text-[#3E4A4A]">
                  <CheckCircle2 className="h-4 w-4 text-[#7FC8A9]" aria-hidden="true" />
                  {item}
                </div>
              ))}
            </div>
            <div className="mt-6 border-t border-[#D8E2DD] pt-5">
              <p className="mb-3 text-sm font-bold text-[#263B3C]">Adicionais opcionais</p>
              <div className="flex flex-wrap gap-2">
                {extraOptions.map((extra) => (
                  <span key={extra} className="rounded-md border border-[#D8E2DD] bg-white px-3 py-2 text-sm font-medium text-[#60706F]">
                    {extra}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="agenda" className="bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <SectionHeader
            eyebrow="Agenda"
            title="Escolha um dia livre e envie sua solicitação"
            text="Os dias ocupados e indisponíveis ficam bloqueados. O MVP considera uma faxina por dia."
          />
          <div className="mt-10 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <Calendar
              monthDate={monthDate}
              bookings={bookings}
              blockedDates={blockedDates}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              onMonthChange={setMonthDate}
            />
            <BookingForm
              selectedDate={selectedDate}
              whatsappNumber={whatsappNumber}
              onBookingCreated={handleBookingCreated}
            />
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <SectionHeader
            eyebrow="Diferenciais"
            title="Confiança em cada detalhe"
            text="A experiência foi pensada para reduzir dúvidas e facilitar o contato sem perder o cuidado humano."
          />
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {differentials.map(([text, Icon]) => (
              <div key={text} className="flex items-center gap-3 rounded-lg border border-[#D8E2DD] bg-white p-4 shadow-sm">
                <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#E7F6F0] text-[#2F5D62]">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="font-bold text-[#263B3C]">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#F4EFE8] px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <SectionHeader
            eyebrow="Depoimentos"
            title="Estrutura pronta para prova social"
            text="Cards simulados ajudam a visualizar a página como um serviço real e podem ser substituídos por avaliações verdadeiras."
          />
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <article key={testimonial.name} className="rounded-lg border border-white bg-white p-5 shadow-sm">
                <div className="mb-4 flex gap-1 text-[#D9B86C]">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className="h-4 w-4 fill-current" aria-hidden="true" />
                  ))}
                </div>
                <p className="leading-7 text-[#60706F]">“{testimonial.text}”</p>
                <p className="mt-4 font-bold text-[#263B3C]">{testimonial.name}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-3">
          {[
            ["Pagamento no MVP", "Solicitação e confirmação pelo WhatsApp, com estrutura pronta para sinal ou valor total.", WalletCards],
            ["Evolução planejada", "Mercado Pago ou Stripe podem atualizar status como confirmado, cancelado e indisponível.", CheckCircle2],
            ["Backend real", "Reservas, clientes e bloqueios podem migrar para Supabase ou Firebase.", ClipboardCheck],
          ].map(([title, text, Icon]) => (
            <div key={title as string} className="rounded-lg border border-[#D8E2DD] bg-[#F8FBFA] p-5">
              <Icon className="h-6 w-6 text-[#2F5D62]" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-bold text-[#263B3C]">{title as string}</h3>
              <p className="mt-2 text-sm leading-6 text-[#60706F]">{text as string}</p>
            </div>
          ))}
        </div>
      </section>

      <AdminPanel
        bookings={bookings}
        blockedDates={blockedDates}
        whatsappNumber={whatsappNumber}
        onWhatsappChange={setWhatsappNumber}
        onStatusChange={handleStatusChange}
        onToggleBlockedDate={handleToggleBlockedDate}
      />

      <footer className="bg-[#243F42] px-4 py-10 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-lg bg-white">
                <Image
                  src="/brand/brilho-certo-icone-crop.png"
                  alt=""
                  width={48}
                  height={48}
                  className="h-10 w-10 object-contain"
                />
              </span>
              <div>
                <p className="text-lg font-bold">Brilho Certo</p>
                <p className="text-sm text-white/70">Limpeza com cuidado e confiança.</p>
              </div>
            </div>
            <p className="mt-5 max-w-xl text-sm leading-6 text-white/72">
              Política de cancelamento: reagendamentos e cancelamentos devem ser
              combinados pelo WhatsApp com antecedência mínima de 24 horas.
            </p>
          </div>
          <div>
            <h3 className="font-bold">Contato</h3>
            <a className="mt-3 flex items-center gap-2 text-sm text-white/78 hover:text-white" href={quickWhatsApp}>
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              WhatsApp
            </a>
            <p className="mt-2 flex items-center gap-2 text-sm text-white/78">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              Cidade e bairros atendidos
            </p>
            <p className="mt-2 text-sm text-white/78">Instagram: @brilhocerto</p>
          </div>
          <div>
            <h3 className="font-bold">Atendimento</h3>
            <p className="mt-3 text-sm text-white/78">Segunda a sábado</p>
            <p className="mt-2 text-sm text-white/78">08:00 às 18:00</p>
            <p className="mt-2 text-sm text-white/78">Diária residencial a partir de R$150</p>
          </div>
        </div>
      </footer>

      <a
        className="fixed bottom-4 right-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-[#25D366] text-white shadow-2xl shadow-[#25D366]/30 transition hover:scale-105"
        href={quickWhatsApp}
        aria-label="Abrir conversa no WhatsApp"
      >
        <MessageCircle className="h-6 w-6" aria-hidden="true" />
      </a>
    </main>
  );
}
