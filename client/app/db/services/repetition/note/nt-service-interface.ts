import { ProxyPropertyType } from "electron-ipc-cat/common";
import { NoteTemplateCreationResult } from "./nt-service.types";

export interface INoteTemplateService {
	/**
	 * Create a new note template with a unique name.
	 * @param templateName template name entered by user
	 */
	createNoteTpl(templateName: string): Promise<NoteTemplateCreationResult>;
}

export const NoteTemplateServiceIPCDescriptor = {
	channel: "noteTemplateService",
	properties: {
		createNoteTpl: ProxyPropertyType.Function,
	},
};
