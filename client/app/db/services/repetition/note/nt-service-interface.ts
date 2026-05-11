import { ProxyPropertyType } from "electron-ipc-cat/common";
import {
	CardTemplateCreationResult,
	NoteTplRef,
	NoteTemplate,
	NoteTemplateCreationResult,
	NoteTemplateDeletionResult,
} from "./nt-service.types";

export interface INoteTemplateService {
	/**
	 * Create a new note template with a unique name.
	 * @param templateName template name entered by user
	 */
	createNoteTpl(templateName: string): Promise<NoteTemplateCreationResult>;
	/**
	 * Create a new card template under the note template id.
	 * @param noteTplId note template id in hex string format
	 * @param templateName card template name entered by user
	 */
	createCardTpl(noteTplId: string, templateName: string): Promise<CardTemplateCreationResult>;
	/**
	 * Get all note templates.
	 */
	getAllNoteTplRefs(): Promise<NoteTplRef[]>;
	/**
	 * Delete note template by id.
	 * @param templateId note template id in hex string format
	 */
	deleteNoteTpl(templateId: string): Promise<NoteTemplateDeletionResult>;
	/**
	 * Get note template detail by id.
	 * @param templateId note template id in hex string format
	 */
	getNoteTplById(templateId: string): Promise<NoteTemplate | null>;
}

export const NoteTemplateServiceIPCDescriptor = {
	channel: "noteTemplateService",
	properties: {
		createNoteTpl: ProxyPropertyType.Function,
		createCardTpl: ProxyPropertyType.Function,
		getAllNoteTplRefs: ProxyPropertyType.Function,
		deleteNoteTpl: ProxyPropertyType.Function,
		getNoteTplById: ProxyPropertyType.Function,
	},
};
