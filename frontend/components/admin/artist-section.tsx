import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { Artist, Artwork, ArtworkImage, ArtworkStatus, Category, Order } from "@/types";
import { ArtworkAdminCard } from "@/components/admin/artwork-card";
import { PhotoUploadCard, buttonClassName, dangerButtonClassName, inputClassName, secondaryButtonClassName, smallInputClassName } from "@/components/admin/forms";
import { orderStatusClassName, orderStatusLabel } from "@/components/admin/helpers";

type ArtistPhotoSlot = "home" | "about";

export function AdminArtistSection({
  artist,
  setArtist,
  saving,
  uploadingArtistPhoto,
  onSave,
  onUploadPhoto,
}: {
  artist: Artist;
  setArtist: Dispatch<SetStateAction<Artist>>;
  saving: boolean;
  uploadingArtistPhoto: ArtistPhotoSlot | null;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onUploadPhoto: (slot: ArtistPhotoSlot, file: File | undefined) => void;
}) {
  return (
    <section className="mt-6 rounded-[8px] border border-border p-4">
      <h2 className="text-[24px] font-semibold leading-[120%] text-ink">
        Профиль художницы
      </h2>

      <form onSubmit={onSave} className="mt-5 grid gap-3 md:grid-cols-2">
        <input
          required
          value={artist.name}
          onChange={(event) =>
            setArtist({ ...artist, name: event.target.value })
          }
          placeholder="Имя RU"
          className={inputClassName}
        />
        <input
          required
          value={artist.name_en}
          onChange={(event) =>
            setArtist({ ...artist, name_en: event.target.value })
          }
          placeholder="Имя EN"
          className={inputClassName}
        />
        <input
          type="email"
          value={artist.email}
          onChange={(event) =>
            setArtist({ ...artist, email: event.target.value })
          }
          placeholder="Email"
          className={inputClassName}
        />
        <input
          value={artist.instagram}
          onChange={(event) =>
            setArtist({ ...artist, instagram: event.target.value })
          }
          placeholder="Instagram"
          className={inputClassName}
        />
        <input
          value={artist.photo_url}
          onChange={(event) =>
            setArtist({ ...artist, photo_url: event.target.value })
          }
          placeholder="URL фотографии по умолчанию"
          className={`${inputClassName} md:col-span-2`}
        />
        <input
          value={artist.home_photo_url}
          onChange={(event) =>
            setArtist({ ...artist, home_photo_url: event.target.value })
          }
          placeholder="URL фото для главной"
          className={inputClassName}
        />
        <input
          value={artist.about_photo_url}
          onChange={(event) =>
            setArtist({ ...artist, about_photo_url: event.target.value })
          }
          placeholder="URL фото для страницы Об авторе"
          className={inputClassName}
        />

        <PhotoUploadCard
          title="Фото для главной"
          imageUrl={artist.home_photo_url || artist.photo_url}
          loading={uploadingArtistPhoto === "home"}
          onChange={(file) => onUploadPhoto("home", file)}
        />

        <PhotoUploadCard
          title="Фото для страницы Об авторе"
          imageUrl={artist.about_photo_url || artist.photo_url}
          loading={uploadingArtistPhoto === "about"}
          onChange={(file) => onUploadPhoto("about", file)}
        />

        <textarea
          value={artist.bio}
          onChange={(event) =>
            setArtist({ ...artist, bio: event.target.value })
          }
          placeholder="Artist statement RU"
          rows={4}
          className={`${inputClassName} md:col-span-2`}
        />
        <textarea
          value={artist.bio_en}
          onChange={(event) =>
            setArtist({ ...artist, bio_en: event.target.value })
          }
          placeholder="Artist statement EN"
          rows={4}
          className={`${inputClassName} md:col-span-2`}
        />
        <button
          type="submit"
          disabled={saving}
          className={`${buttonClassName} md:col-span-2`}
        >
          Сохранить профиль
        </button>
      </form>
    </section>
  );
}