-- Add temporary customer fields on transports
alter table public.transports
  add column if not exists customer_name text,
  add column if not exists customer_phone text;

-- Optional: comment for documentation
comment on column public.transports.customer_name is 'Nome cliente temporaneo per trasporti senza client_id';
comment on column public.transports.customer_phone is 'Telefono cliente temporaneo per trasporti senza client_id';

