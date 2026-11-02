import {createShareComposition} from '@gaga/arsenal/share';
import {personalCanonicalOrigin} from './personal-state.mjs';
export const {resolveShareContext,shareSourceUrl,shareCopy,sharePayload,shareActions,textCard,posterInput,wrapPosterText,shareOutcomeMessage}=createShareComposition({
 canonicalOrigin:personalCanonicalOrigin,posterLimits:{title:240,selection:600},messages:{shared:'Dibagikan.',copied:'Disalin.',cancelled:'Pembagian dibatalkan.',unsupported:'Native Share tidak tersedia. Gunakan Salin tautan.',failed:'Belum dapat dibagikan. Coba Salin tautan.',fallback:'Aksi belum selesai.'}
});
