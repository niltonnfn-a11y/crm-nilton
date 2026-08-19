drop policy if exists "Users manage their own contacts" on contacts;
create policy "Users manage their own contacts"
  on contacts
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage their own deals" on deals;
create policy "Users manage their own deals"
  on deals
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from contacts
      where contacts.id = deals.contact_id
        and contacts.user_id = auth.uid()
    )
  );
