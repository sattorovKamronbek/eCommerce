-- Hosted Storage reads object metadata before returning the image bytes.
begin;

alter policy marketplace_cs2_images_public_download on storage.objects
  using (bucket_id = 'marketplace-cs2-images'
    and (select storage.allow_any_operation(array['object.get_authenticated_info', 'storage.object.get_authenticated']))
    and marketplace_private.cs2_image_is_public(name, owner_id));

alter policy marketplace_cs2_images_owner_read on storage.objects
  using (bucket_id = 'marketplace-cs2-images' and owner_id = (select auth.uid()::text)
    and (select storage.allow_any_operation(array['object.get_authenticated_info', 'storage.object.get_authenticated',
      'storage.object.delete', 'storage.object.delete_many']))
    and (select marketplace_private.can_manage_listing(auth.uid(), 'cs2')));

commit;
