# Prez reference-data overrides

The endpoint definition configures the three-level catalogue hierarchy in `pid-register-data`. Models, Organisations,
PIDs and Validators are root catalogues. Their members appear at level two; PID records appear as level-three items
beneath the four PID subcatalogues. Catalogue membership uses `rdfs:member` in both the source data and endpoint shapes.
The custom open-object profile excludes structural `rdfs:member` and `olis:includes` predicates from metadata without
transforming the source data.
