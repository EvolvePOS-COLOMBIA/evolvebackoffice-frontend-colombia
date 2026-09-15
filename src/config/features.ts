/**
 * Flags de capacidades del backend.
 *
 * Cada flag corresponde a un endpoint que el onboarding necesita pero que
 * todavía no existe en la API (verificado contra el Swagger de
 * posco.ursposdemo.com el 2026-08-26). Mientras el flag esté en `false`, el
 * servicio correspondiente resuelve contra la capa mock y la UI funciona igual.
 *
 * Cuando el backend entregue el endpoint: poner el flag en `true` y borrar la
 * rama mock del servicio. Ningún componente debería necesitar cambios.
 */
export const features = {
  /**
   * `PUT /api/Tenants/{id}` existe pero exige rol Admin global y no acepta
   * `X-Tenant-Id`, así que el admin del negocio no puede editar sus propios
   * datos. Hace falta algo tipo `GET/PUT /api/tenant/profile` con scope de tenant.
   */
  tenantProfileApi: false,

  /**
   * Catálogo de tipos de negocio (`GET /api/business-types`) y un
   * `businessTypeId` en `CreateBranchDto` / `BranchResponseDto`.
   */
  businessTypesApi: false,

  /**
   * Módulos habilitados por sucursal (`GET/POST/DELETE /api/Branches/{id}/modules`).
   * Verificado contra el Swagger de juacopizza.ursposdemo.com el 2026-09-09.
   */
  branchModulesApi: true,

  /**
   * Estado del onboarding persistido en el tenant (`onboardingCompletedAt` o
   * `GET /api/tenant/setup-state`). Mientras esté en `false`, el gate infiere
   * el estado contando sucursales y lo cachea en el store local.
   */
  onboardingStateApi: false,
} as const

export type FeatureFlag = keyof typeof features
