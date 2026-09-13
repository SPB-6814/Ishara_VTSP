-- Ishara: Close duplicate test sessions
UPDATE public.sessions
SET status = 'closed', closed_at = now()
WHERE patient_display_name = 'Patient Bed 4A (Ramesh)'
  AND id != '00000000-0000-0000-0000-000000000001';
