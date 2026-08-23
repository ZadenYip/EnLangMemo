import { ProxyPropertyType } from "electron-ipc-cat/common";
import {
	NoteTplRef,
	NoteTemplate,
	NoteTemplateSaveResult,
} from "./nt-tpl-service-types.js";

export interface INoteTplService {
	/**
	 * Get all note templates.
	 */
	getAllNoteTplRefs(): Promise<NoteTplRef[]>;
	/**
	 * Get note template detail by id.
	 * @param templateId note template id in hex string format
	 */
	getNoteTplById(templateId: string): Promise<NoteTemplate | null>;
	/**
	 * Save note template content by id.
	 * @param templateId note template id in hex string format
	 * @param noteTemplate note template payload to persist
	 */
	saveNoteTpl(templateId: string, noteTemplate: NoteTemplate): Promise<NoteTemplateSaveResult>;
}

export const NoteTplServiceIPCDescriptor = {
	channel: "noteTemplateService",
	properties: {
		getAllNoteTplRefs: ProxyPropertyType.Function,
		getNoteTplById: ProxyPropertyType.Function,
		saveNoteTpl: ProxyPropertyType.Function,
	},
};
