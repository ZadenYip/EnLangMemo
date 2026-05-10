import { ProxyPropertyType } from "electron-ipc-cat/common";
import { NoteTplRef, NoteTemplateCreationResult, NoteTemplateDeletionResult } from "./nt-service.types";

export interface INoteTemplateService {
	/**
	 * Create a new note template with a unique name.
	 * @param templateName template name entered by user
	 */
	createNoteTpl(templateName: string): Promise<NoteTemplateCreationResult>;
	/**
	 * Get all note templates.
	 */
	getAllNoteTplRefs(): Promise<NoteTplRef[]>;
	/**
	 * Delete note template by id.
	 * @param templateId note template id in hex string format
	 */
	deleteNoteTpl(templateId: string): Promise<NoteTemplateDeletionResult>;
}

export const NoteTemplateServiceIPCDescriptor = {
	channel: "noteTemplateService",
	properties: {
		createNoteTpl: ProxyPropertyType.Function,
		getAllNoteTplRefs: ProxyPropertyType.Function,
		deleteNoteTpl: ProxyPropertyType.Function,
	},
};
