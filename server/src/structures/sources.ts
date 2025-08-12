import { StructurePredicate } from "../util/loaders";

export interface Source {
	tries: number;
	Name: string;
	friendlyName: string;
	Search: (artist: string, title: string, keywords: string) => any[];
	Download: (searchResult: any) => string;
}

export const predicate: StructurePredicate<Source> = (structure) =>
	Boolean(structure) &&
	typeof structure === "object" &&
	"Name" in structure &&
	"friendlyName" in structure &&
	"Search" in structure &&
	"Download" in structure &&
	typeof structure.Name === "string" &&
	typeof structure.friendlyName === "string" &&
	typeof structure.Search === "function" &&
	typeof structure.Download === "function";
